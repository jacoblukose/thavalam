import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { db, pool } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    passport: { user: string };
  }
}

declare global {
  namespace Express {
    interface User {
      id: string;
      googleId: string;
      email: string;
      name: string;
      picture: string | null;
      createdAt: Date;
    }
  }
}

export function setupAuth(app: Express) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn("Google OAuth credentials not set, auth disabled");
    return;
  }

  // Trust Azure's reverse proxy so Express sees HTTPS
  app.set("trust proxy", 1);

  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "thavalam-session-secret",
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize() as RequestHandler);
  app.use(passport.session() as RequestHandler);

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: "/api/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value ?? "";
          const name = profile.displayName ?? "";
          const picture = profile.photos?.[0]?.value ?? null;

          let [user] = await db
            .select()
            .from(users)
            .where(eq(users.googleId, googleId));

          if (!user) {
            [user] = await db
              .insert(users)
              .values({ googleId, email, name, picture })
              .returning();
          } else {
            [user] = await db
              .update(users)
              .set({ email, name, picture })
              .where(eq(users.googleId, googleId))
              .returning();
          }

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user || null);
    } catch (err) {
      done(err);
    }
  });

  // Auth routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    }) as RequestHandler
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/?error=auth",
    }) as RequestHandler,
    (_req, res) => {
      res.redirect("/garage");
    }
  );

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user!;
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ ok: true });
      });
    });
  });
}
