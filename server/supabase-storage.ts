function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error("SUPABASE_URL not set");
  }
  return url;
}

const BUCKET = "vehicle-documents";

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_KEY not set");
  }
  return key;
}

export async function uploadToSupabase(
  buffer: Buffer,
  path: string,
  contentType: string,
): Promise<string> {
  const res = await fetch(
    `${getSupabaseUrl()}/storage/v1/object/${BUCKET}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getServiceKey()}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: buffer,
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upload failed: ${text}`);
  }

  return `${getSupabaseUrl()}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function deleteFromSupabase(fileUrl: string): Promise<void> {
  const prefix = `${getSupabaseUrl()}/storage/v1/object/public/${BUCKET}/`;
  if (!fileUrl.startsWith(prefix)) return;

  const path = fileUrl.slice(prefix.length);
  await fetch(`${getSupabaseUrl()}/storage/v1/object/${BUCKET}/${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getServiceKey()}`,
    },
  });
}
