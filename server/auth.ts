import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { db, pool } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateAlias, generateAvatarColor } from "./alias";
import { storage } from "./storage";

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
      alias: string | null;
      avatarColor: string | null;
      currency: string;
      timezone: string;
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
      secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === "production"
        ? (() => { throw new Error("SESSION_SECRET must be set in production"); })()
        : "thavalam-dev-secret"),
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
              .values({
                googleId,
                email,
                name,
                picture,
                alias: generateAlias(),
                avatarColor: generateAvatarColor(),
              })
              .returning();
          } else {
            // Backfill alias for existing users
            const updates: Record<string, string> = { email, name };
            if (picture) updates.picture = picture;
            if (!user.alias) updates.alias = generateAlias();
            if (!user.avatarColor) updates.avatarColor = generateAvatarColor();

            [user] = await db
              .update(users)
              .set(updates)
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
    (req, res) => {
      // Regenerate session after login to prevent session fixation
      const user = req.user;
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration failed:", err);
          return res.redirect("/?error=auth");
        }
        // Re-attach user to new session
        req.logIn(user!, (loginErr) => {
          if (loginErr) {
            console.error("Re-login after session regeneration failed:", loginErr);
            return res.redirect("/?error=auth");
          }
          res.redirect("/garage");
        });
      });
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
        alias: user.alias,
        avatarColor: user.avatarColor,
        currency: user.currency,
        timezone: user.timezone,
      });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  const VALID_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD", "JPY"];
  const VALID_TIMEZONES = [
    "Asia/Kolkata", "America/New_York", "America/Chicago", "America/Denver",
    "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Dubai",
    "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
  ];

  app.patch("/api/auth/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { currency, timezone } = req.body;
    const updates: Record<string, string> = {};
    if (currency && typeof currency === "string") {
      if (!VALID_CURRENCIES.includes(currency)) {
        return res.status(400).json({ error: "Invalid currency" });
      }
      updates.currency = currency;
    }
    if (timezone && typeof timezone === "string") {
      if (!VALID_TIMEZONES.includes(timezone)) {
        return res.status(400).json({ error: "Invalid timezone" });
      }
      updates.timezone = timezone;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, req.user!.id))
      .returning();

    res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      picture: updated.picture,
      alias: updated.alias,
      avatarColor: updated.avatarColor,
      currency: updated.currency,
      timezone: updated.timezone,
    });
  });

  app.get("/api/auth/data-export", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const data = await storage.getUserDataExport(req.user!.id);
    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }
    res.setHeader("Content-Disposition", `attachment; filename="pocket-garage-data-${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.json(data);
  });

  app.delete("/api/auth/account", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = req.user!.id;
    await storage.deleteUserAccount(userId);
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Account deleted but logout failed" });
      }
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ ok: true });
      });
    });
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
