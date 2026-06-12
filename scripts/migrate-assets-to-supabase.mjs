import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const BUCKET = process.env.SUPABASE_BUCKET || "portfolio-assets";

function loadEnvFile(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return;

  const lines = fs.readFileSync(absolutePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function contentTypeForExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

async function readSourceBytes(source) {
  if (!source) return null;

  if (source.startsWith("/")) {
    const absolute = path.join(root, "public", source.replace(/^\//, ""));
    if (!fs.existsSync(absolute)) return null;
    return {
      bytes: fs.readFileSync(absolute),
      contentType: contentTypeForExtension(absolute),
      filename: path.basename(absolute),
    };
  }

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to download ${source}: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const pathname = new URL(source).pathname;
    return {
      bytes: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") || contentTypeForExtension(pathname),
      filename: path.basename(pathname) || "asset",
    };
  }

  return null;
}

async function uploadAndGetUrl(admin, objectPath, source) {
  const payload = await readSourceBytes(source);
  if (!payload) return null;

  const { error } = await admin.storage.from(BUCKET).upload(objectPath, payload.bytes, {
    upsert: true,
    contentType: payload.contentType,
    cacheControl: "31536000",
  });

  if (error) throw error;

  const { data } = admin.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

function normalizeStoragePath(table, row, filename) {
  const safeName = filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  if (table === "projects") return `projects/${row.slug}/${safeName}`;
  if (table === "events") return `events/${row.slug}/${safeName}`;
  return `certifications/${row.id}/${safeName}`;
}

async function migrateTable(admin, table) {
  const selectByTable = {
    projects: "slug,title,image_path",
    certifications: "id,name,image_path",
    events: "slug,title,image_path",
  };

  const { data, error } = await admin.from(table).select(selectByTable[table]);
  if (error) throw error;

  let updated = 0;
  let skipped = 0;

  for (const row of data ?? []) {
    const source = row.image_path;
    if (!source) {
      skipped += 1;
      continue;
    }

    if (typeof source !== "string") {
      skipped += 1;
      continue;
    }

    if (source.includes(`/storage/v1/object/public/${BUCKET}/`)) {
      skipped += 1;
      continue;
    }

    const payload = await readSourceBytes(source);
    if (!payload) {
      skipped += 1;
      continue;
    }

    const objectPath = normalizeStoragePath(table, row, payload.filename);
    const publicUrl = await uploadAndGetUrl(admin, objectPath, source);
    if (!publicUrl) {
      skipped += 1;
      continue;
    }

    const identifierKey = table === "certifications" ? "id" : "slug";
    const identifierValue = table === "certifications" ? row.id : row.slug;

    const { error: updateError } = await admin
      .from(table)
      .update({ image_path: publicUrl })
      .eq(identifierKey, identifierValue);

    if (updateError) throw updateError;
    updated += 1;
  }

  return { updated, skipped };
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY");

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];
for (const table of ["projects", "certifications", "events"]) {
  results.push([table, await migrateTable(admin, table)]);
}

for (const [table, result] of results) {
  console.log(`${table}: updated ${result.updated}, skipped ${result.skipped}`);
}
