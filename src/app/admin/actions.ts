"use server";

import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { isAllowedAdminEmail, SUPABASE_BUCKET } from "@/lib/supabase/config";

type CmsTable =
  | "projects"
  | "experience_items"
  | "certifications"
  | "events"
  | "skill_categories"
  | "skills";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function extensionFromFilename(value: string) {
  const match = /\.[a-z0-9]+$/i.exec(value);
  return match ? match[0].toLowerCase() : "";
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function numberOrZero(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : 0;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function tags(formData: FormData, key: string) {
  return text(formData, key)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function requiredText(formData: FormData, key: string, label: string) {
  const value = text(formData, key);
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

async function ensureUniqueByKey(
  table: CmsTable,
  key: string,
  nextValue: string,
  currentValue?: string | null,
) {
  if (!nextValue || (currentValue && currentValue === nextValue)) return;

  const admin = await requireAdmin();
  const { data, error } = await admin.from(table).select(key).eq(key, nextValue).maybeSingle();
  if (error) throw error;
  if (data) throw new Error(`${table.replace(/_/g, " ")} already has a record using this ${key}.`);
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) redirect("/admin/login?error=env");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  if (!isAllowedAdminEmail(user.email)) redirect("/admin/login?error=forbidden");

  return admin;
}

async function uploadAssetIfPresent(
  formData: FormData,
  field: string,
  objectBasePath: string,
  existingPath?: string | null,
) {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Upload is too large. Use files up to 8MB.");
  }

  const allowed = file.type.startsWith("image/") || file.type === "application/pdf";
  if (!allowed) throw new Error("Only images and PDFs are supported.");

  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase service role is not configured.");

  const extension = extensionFromFilename(file.name);
  const path = `${objectBasePath}${extension}`;
  const { error } = await admin.storage
    .from(SUPABASE_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  if (existingPath && existingPath.includes(`/storage/v1/object/public/${SUPABASE_BUCKET}/`)) {
    const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
    const previousObjectPath = existingPath.split(marker)[1];
    if (previousObjectPath && previousObjectPath !== path) {
      await admin.storage.from(SUPABASE_BUCKET).remove([previousObjectPath]);
    }
  }

  const { data } = admin.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function mutateAndRefresh<T extends Record<string, unknown>>(
  table: CmsTable,
  payload: T,
  conflictTarget?: string,
) {
  const admin = await requireAdmin();
  const query = conflictTarget
    ? admin.from(table).upsert(payload, { onConflict: conflictTarget })
    : admin.from(table).upsert(payload);

  const { error } = await query;
  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  redirect("/admin");
}

export async function signInWithMagicLink(formData: FormData) {
  const email = text(formData, "email").toLowerCase();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?error=env");
  if (!isAllowedAdminEmail(email)) redirect("/admin/login?error=forbidden");

  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/admin`,
    },
  });

  if (error) redirect("/admin/login?error=signin");
  redirect("/admin/login?sent=1");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

export async function saveProject(formData: FormData) {
  await requireAdmin();
  const title = requiredText(formData, "title", "Title");
  const slug = text(formData, "slug") || slugify(title);
  const currentSlug = optionalText(formData, "current_slug");
  const year = requiredText(formData, "year", "Year");
  const role = requiredText(formData, "role", "Role");
  const description = requiredText(formData, "description", "Description");
  await ensureUniqueByKey("projects", "slug", slug, currentSlug);
  const existingImagePath = optionalText(formData, "existing_image_path");
  const image = await uploadAssetIfPresent(
    formData,
    "image_file",
    `projects/${slug}/preview`,
    existingImagePath,
  );

  await mutateAndRefresh(
    "projects",
    {
      slug,
      title,
      description,
      long_description: optionalText(formData, "long_description"),
      tags: tags(formData, "tags"),
      github_url: optionalText(formData, "github_url"),
      live_url: optionalText(formData, "live_url"),
      image_path: image ?? existingImagePath,
      image_seed: slug,
      year,
      role,
      featured: bool(formData, "featured"),
      status: optionalText(formData, "status"),
      sort_order: numberOrZero(formData, "sort_order"),
      published: bool(formData, "published"),
    },
    "slug",
  );
}

export async function saveExperience(formData: FormData) {
  const organization = requiredText(formData, "organization", "Organization");
  const slug = text(formData, "slug") || slugify(organization);
  const currentSlug = optionalText(formData, "current_slug");
  const role = requiredText(formData, "role", "Role");
  const period = requiredText(formData, "period", "Period");
  const description = requiredText(formData, "description", "Description");
  const type = requiredText(formData, "type", "Type");
  await ensureUniqueByKey("experience_items", "slug", slug, currentSlug);
  await mutateAndRefresh(
    "experience_items",
    {
      slug,
      organization,
      role,
      period,
      description,
      type,
      sort_order: numberOrZero(formData, "sort_order"),
      published: bool(formData, "published"),
    },
    "slug",
  );
}

export async function saveCertification(formData: FormData) {
  await requireAdmin();
  const name = requiredText(formData, "name", "Name");
  const issuer = requiredText(formData, "issuer", "Issuer");
  const id = optionalText(formData, "id") ?? crypto.randomUUID();
  const existingImagePath = optionalText(formData, "existing_image_path");
  const image = await uploadAssetIfPresent(
    formData,
    "image_file",
    `certifications/${id}/asset`,
    existingImagePath,
  );

  await mutateAndRefresh("certifications", {
    id,
    name,
    issuer,
    issued: optionalText(formData, "issued"),
    expires: optionalText(formData, "expires"),
    image_path: image ?? existingImagePath,
    sort_order: numberOrZero(formData, "sort_order"),
    published: bool(formData, "published"),
  });
}

export async function saveEvent(formData: FormData) {
  await requireAdmin();
  const title = requiredText(formData, "title", "Title");
  const slug = text(formData, "slug") || slugify(title);
  const currentSlug = optionalText(formData, "current_slug");
  const eventDate = requiredText(formData, "event_date", "Date");
  const venue = requiredText(formData, "venue", "Venue");
  await ensureUniqueByKey("events", "slug", slug, currentSlug);
  const existingImagePath = optionalText(formData, "existing_image_path");
  const image = await uploadAssetIfPresent(
    formData,
    "image_file",
    `events/${slug}/image`,
    existingImagePath,
  );

  await mutateAndRefresh(
    "events",
    {
      slug,
      title,
      event_date: eventDate,
      year: eventDate ? new Date(`${eventDate}T00:00:00`).getFullYear().toString() : null,
      venue,
      organizers: optionalText(formData, "organizers"),
      role: optionalText(formData, "role"),
      category: optionalText(formData, "category"),
      image_path: image ?? existingImagePath,
      sort_order: numberOrZero(formData, "sort_order"),
      published: bool(formData, "published"),
    },
    "slug",
  );
}

export async function saveSkillCategory(formData: FormData) {
  const id = optionalText(formData, "id");
  await mutateAndRefresh("skill_categories", {
    ...(id ? { id } : {}),
    name: requiredText(formData, "name", "Name"),
    sort_order: numberOrZero(formData, "sort_order"),
    published: bool(formData, "published"),
  });
}

export async function saveSkill(formData: FormData) {
  const id = optionalText(formData, "id");
  await mutateAndRefresh("skills", {
    ...(id ? { id } : {}),
    category_id: requiredText(formData, "category_id", "Category"),
    name: requiredText(formData, "name", "Name"),
    sort_order: numberOrZero(formData, "sort_order"),
  });
}

export async function saveSiteContent(formData: FormData) {
  const admin = await requireAdmin();
  const key = requiredText(formData, "key", "Key");
  const rawValue = requiredText(formData, "value", "Value");
  const value = JSON.parse(rawValue);
  const { error } = await admin.from("site_content").upsert({ key, value }, { onConflict: "key" });
  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  redirect("/admin");
}

export async function deleteRecord(formData: FormData) {
  const table = text(formData, "table") as CmsTable;
  const id = text(formData, "id");
  const key = text(formData, "key") || (table === "projects" || table === "experience_items" || table === "events" ? "slug" : "id");

  const admin = await requireAdmin();
  const { error } = await admin.from(table).delete().eq(key, id);
  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  redirect("/admin");
}
