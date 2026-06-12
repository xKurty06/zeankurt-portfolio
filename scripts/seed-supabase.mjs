import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const nodeRequire = createRequire(import.meta.url);

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

loadEnvFile(".env.local");
loadEnvFile(".env");

function loadTsModule(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const exports = {};
  const module = { exports };
  const context = {
    exports,
    module,
    require(specifier) {
      if (specifier.startsWith("@/")) {
        const resolved = `src/${specifier.slice(2)}.ts`;
        return loadTsModule(resolved);
      }
      return nodeRequire(specifier);
    },
  };

  vm.runInNewContext(output, context, { filename: absolutePath });
  return module.exports;
}

function isoDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function deterministicUuid(parts) {
  const hex = crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function isRemoteAssetPath(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function pickSeedImagePath(source, existing) {
  if (isRemoteAssetPath(existing)) return existing;
  if (isRemoteAssetPath(source)) return source;
  return null;
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY");
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { projects } = loadTsModule("src/data/projects.ts");
const {
  experience,
  certifications,
  eventHighlights,
  skillCategories,
} = loadTsModule("src/data/skills.ts");
const { siteConfig, aboutContent } = loadTsModule("src/data/site.ts");

const defaultCreativeCategories = [
  {
    slug: "portraits",
    name: "Portrait",
    description: "Portrait sessions, editorials, and expression-led frames.",
  },
  {
    slug: "events",
    name: "Event",
    description: "Community events, campus activations, and live coverage.",
  },
  {
    slug: "street-photography",
    name: "Street",
    description: "Candid public-space moments, urban detail, and everyday rhythm.",
  },
  {
    slug: "creative-shots",
    name: "Creative",
    description: "Experimental compositions, concepts, and stylized visual studies.",
  },
  {
    slug: "astrophotography",
    name: "Astrophotography",
    description: "Night-sky studies, moon captures, and long-exposure celestial work.",
  },
];

const [
  existingProjectsResult,
  existingCertificationsResult,
] = await Promise.all([
  admin.from("projects").select("slug,image_path"),
  admin.from("certifications").select("id,name,issuer,issued,expires,image_path"),
]);

if (existingProjectsResult.error) throw existingProjectsResult.error;
if (existingCertificationsResult.error) throw existingCertificationsResult.error;

const existingProjectImages = new Map(
  (existingProjectsResult.data ?? []).map((row) => [row.slug, row.image_path]),
);
const existingCertificationImages = new Map(
  (existingCertificationsResult.data ?? []).map((row) => [
    deterministicUuid([row.name, row.issuer, row.issued ?? "", row.expires ?? ""]),
    row.image_path,
  ]),
);

async function upsert(table, rows, onConflict) {
  if (!rows.length) return [];
  const query = admin.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
  const { data, error } = await query.select();
  if (error) throw error;
  return data ?? [];
}

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

await upsert(
  "admin_users",
  adminEmails.map((email) => ({ email })),
  "email",
);

await upsert(
  "projects",
  projects.map((project, index) => ({
    slug: project.slug,
    title: project.title,
    description: project.description,
    long_description: project.longDescription ?? null,
    tags: project.tags,
    github_url: project.githubUrl ?? null,
    live_url: project.liveUrl ?? null,
    image_path: pickSeedImagePath(project.image, existingProjectImages.get(project.slug)),
    image_seed: project.imageSeed ?? project.slug,
    year: project.year,
    role: project.role,
    featured: project.featured,
    status: project.status ?? null,
    sort_order: index,
    published: true,
  })),
  "slug",
);

await upsert(
  "experience_items",
  experience.map((item, index) => ({
    slug: item.id,
    organization: item.organization,
    role: item.role,
    period: item.period,
    description: item.description,
    type: item.type,
    sort_order: index,
    published: true,
  })),
  "slug",
);

await upsert(
  "certifications",
  certifications.map((cert, index) => {
    const id = deterministicUuid([cert.name, cert.issuer, cert.issued ?? "", cert.expires ?? ""]);
    return {
    id,
    name: cert.name,
    issuer: cert.issuer,
    issued: cert.issued ?? null,
    expires: cert.expires ?? null,
    image_path: pickSeedImagePath(cert.image, existingCertificationImages.get(id)),
    sort_order: index,
    published: true,
  }}),
  "id",
);

await upsert(
  "events",
  eventHighlights.map((event, index) => ({
    slug: event.id,
    title: event.title,
    event_date: isoDate(event.date),
    year: event.year,
    venue: event.venue,
    organizers: event.organizers ?? null,
    role: event.role ?? null,
    category: event.category ?? null,
    image_path: null,
    sort_order: index,
    published: true,
  })),
  "slug",
);

for (const [categoryIndex, category] of skillCategories.entries()) {
  const [savedCategory] = await upsert(
    "skill_categories",
    [{
      name: category.name,
      sort_order: categoryIndex,
      published: true,
    }],
    "name",
  );

  await upsert(
    "skills",
    category.skills.map((skill, skillIndex) => ({
      category_id: savedCategory.id,
      name: skill,
      sort_order: skillIndex,
    })),
    "category_id,name",
  );
}

await upsert(
  "site_content",
  [
    { key: "site_config", value: siteConfig },
    { key: "about_content", value: aboutContent },
  ],
  "key",
);

await upsert(
  "creative_categories",
  defaultCreativeCategories.map((category, index) => ({
    ...category,
    sort_order: index,
    published: true,
  })),
  "slug",
);

console.log("Seeded Supabase portfolio content.");
