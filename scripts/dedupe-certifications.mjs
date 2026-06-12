import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const bucket = process.env.SUPABASE_BUCKET || "portfolio-assets";

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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

function signature(row) {
  return [row.name, row.issuer, row.issued ?? "", row.expires ?? ""].join("|");
}

function storageObjectPathFromUrl(url) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  return typeof url === "string" && url.includes(marker) ? url.split(marker)[1] : null;
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const admin = createClient(
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || requiredEnv("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: rows, error } = await admin
  .from("certifications")
  .select("id,name,issuer,issued,expires,image_path,created_at")
  .order("created_at", { ascending: true });

if (error) throw error;

const groups = new Map();
for (const row of rows ?? []) {
  const key = signature(row);
  const current = groups.get(key) ?? [];
  current.push(row);
  groups.set(key, current);
}

let deletedRows = 0;
let deletedObjects = 0;

for (const [, group] of groups) {
  if (group.length < 2) continue;

  const [keep, ...duplicates] = group;

  for (const duplicate of duplicates) {
    const objectPath = storageObjectPathFromUrl(duplicate.image_path);
    if (objectPath) {
      const { error: removeError } = await admin.storage.from(bucket).remove([objectPath]);
      if (removeError) throw removeError;
      deletedObjects += 1;
    }

    const { error: deleteError } = await admin.from("certifications").delete().eq("id", duplicate.id);
    if (deleteError) throw deleteError;
    deletedRows += 1;
  }

  if (!keep.image_path) {
    const fallback = duplicates.find((item) => item.image_path)?.image_path ?? null;
    if (fallback) {
      const { error: updateError } = await admin
        .from("certifications")
        .update({ image_path: fallback })
        .eq("id", keep.id);
      if (updateError) throw updateError;
    }
  }
}

console.log(`Deleted duplicate certification rows: ${deletedRows}`);
console.log(`Deleted duplicate certification objects: ${deletedObjects}`);
