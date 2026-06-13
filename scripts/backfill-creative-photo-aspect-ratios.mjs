import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const SQUARE_RATIO_TOLERANCE = 0.08;

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

function resolvePhotoAspectRatio(width, height) {
  if (!width || !height) return "landscape";

  const ratio = width / Math.max(height, 1);
  if (Math.abs(1 - ratio) <= SQUARE_RATIO_TOLERANCE) {
    return "square";
  }

  return ratio > 1 ? "landscape" : "portrait";
}

async function detectAspectRatio(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${imageUrl}: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const { info } = await sharp(Buffer.from(arrayBuffer))
    .rotate()
    .toBuffer({ resolveWithObject: true });

  return resolvePhotoAspectRatio(info.width, info.height);
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

const { data: photos, error } = await admin
  .from("creative_photos")
  .select("id,title,image_path,aspect_ratio")
  .order("sort_order", { ascending: true });

if (error) {
  throw error;
}

let updated = 0;
let unchanged = 0;
let failed = 0;

for (const photo of photos ?? []) {
  if (!photo.image_path) {
    unchanged += 1;
    continue;
  }

  try {
    const nextAspectRatio = await detectAspectRatio(photo.image_path);
    if (nextAspectRatio === photo.aspect_ratio) {
      unchanged += 1;
      continue;
    }

    const { error: updateError } = await admin
      .from("creative_photos")
      .update({ aspect_ratio: nextAspectRatio })
      .eq("id", photo.id);

    if (updateError) {
      throw updateError;
    }

    updated += 1;
    console.log(`updated ${photo.title}: ${photo.aspect_ratio} -> ${nextAspectRatio}`);
  } catch (err) {
    failed += 1;
    console.error(`failed ${photo.title}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(`creative_photos aspect backfill complete: updated ${updated}, unchanged ${unchanged}, failed ${failed}`);
