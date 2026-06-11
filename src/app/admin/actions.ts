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
  folder: string,
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

  const path = `${folder}/${Date.now()}-${safeFilename(file.name)}`;
  const { error } = await admin.storage
    .from(SUPABASE_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

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
  const image = await uploadAssetIfPresent(formData, "image_file", "projects/thumbnails");
  const slug = text(formData, "slug") || slugify(text(formData, "title"));

  await mutateAndRefresh(
    "projects",
    {
      slug,
      title: text(formData, "title"),
      description: text(formData, "description"),
      long_description: optionalText(formData, "long_description"),
      tags: tags(formData, "tags"),
      github_url: optionalText(formData, "github_url"),
      live_url: optionalText(formData, "live_url"),
      image_path: image ?? optionalText(formData, "image_path"),
      image_seed: optionalText(formData, "image_seed") ?? slug,
      year: text(formData, "year"),
      role: text(formData, "role"),
      featured: bool(formData, "featured"),
      status: optionalText(formData, "status"),
      sort_order: numberOrZero(formData, "sort_order"),
      published: bool(formData, "published"),
    },
    "slug",
  );
}

export async function saveExperience(formData: FormData) {
  const slug = text(formData, "slug") || slugify(text(formData, "organization"));
  await mutateAndRefresh(
    "experience_items",
    {
      slug,
      organization: text(formData, "organization"),
      role: text(formData, "role"),
      period: text(formData, "period"),
      description: text(formData, "description"),
      type: text(formData, "type"),
      sort_order: numberOrZero(formData, "sort_order"),
      published: bool(formData, "published"),
    },
    "slug",
  );
}

export async function saveCertification(formData: FormData) {
  await requireAdmin();
  const image = await uploadAssetIfPresent(formData, "image_file", "certifications");
  const id = optionalText(formData, "id");

  await mutateAndRefresh("certifications", {
    ...(id ? { id } : {}),
    name: text(formData, "name"),
    issuer: text(formData, "issuer"),
    issued: optionalText(formData, "issued"),
    expires: optionalText(formData, "expires"),
    image_path: image ?? optionalText(formData, "image_path"),
    sort_order: numberOrZero(formData, "sort_order"),
    published: bool(formData, "published"),
  });
}

export async function saveEvent(formData: FormData) {
  await requireAdmin();
  const image = await uploadAssetIfPresent(formData, "image_file", "events");
  const slug = text(formData, "slug") || slugify(text(formData, "title"));
  const eventDate = text(formData, "event_date");

  await mutateAndRefresh(
    "events",
    {
      slug,
      title: text(formData, "title"),
      event_date: eventDate,
      year: eventDate ? new Date(`${eventDate}T00:00:00`).getFullYear().toString() : null,
      venue: text(formData, "venue"),
      organizers: optionalText(formData, "organizers"),
      role: optionalText(formData, "role"),
      category: optionalText(formData, "category"),
      image_path: image ?? optionalText(formData, "image_path"),
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
    name: text(formData, "name"),
    sort_order: numberOrZero(formData, "sort_order"),
    published: bool(formData, "published"),
  });
}

export async function saveSkill(formData: FormData) {
  const id = optionalText(formData, "id");
  await mutateAndRefresh("skills", {
    ...(id ? { id } : {}),
    category_id: text(formData, "category_id"),
    name: text(formData, "name"),
    sort_order: numberOrZero(formData, "sort_order"),
  });
}

export async function saveSiteContent(formData: FormData) {
  const admin = await requireAdmin();
  const key = text(formData, "key");
  const rawValue = text(formData, "value");
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
