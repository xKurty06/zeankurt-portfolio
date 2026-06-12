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
  | "skills"
  | "creative_categories"
  | "creative_photos";

type SortableCmsTable = Exclude<CmsTable, "skills">;

const SORTABLE_KEYS: Record<SortableCmsTable, "slug" | "id"> = {
  projects: "slug",
  experience_items: "slug",
  certifications: "id",
  events: "slug",
  skill_categories: "id",
  creative_categories: "id",
  creative_photos: "id",
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_CREATIVE_UPLOAD_FILES = 8;
const MAX_CSV_UPLOAD_BYTES = 512 * 1024;
const MAX_PROJECT_IMPORT_ROWS = 100;
const PROJECT_IMPORT_HEADERS = [
  "slug",
  "title",
  "year",
  "role",
  "description",
  "long_description",
  "tags",
  "github_url",
  "live_url",
  "status",
  "featured",
  "published",
] as const;

function extensionFromFilename(value: string) {
  const match = /\.[a-z0-9]+$/i.exec(value);
  return match ? match[0].toLowerCase() : "";
}

function publicStorageObjectPath(value: string) {
  const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
  if (!value.includes(marker)) return null;

  const [, objectPath = ""] = value.split(marker);
  return objectPath || null;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function optionalNumber(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function parseBoolean(value: string, fallback = false) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  throw new Error(`Invalid boolean value "${value}". Use true or false.`);
}

function tags(formData: FormData, key: string) {
  return text(formData, key)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseTagsValue(value: string) {
  return value
    .split(/[|,]/)
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

function titleFromFilename(value: string) {
  return value
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  const version = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const path = `${objectBasePath}-${safeFilename(version)}${extension}`;
  const { error } = await admin.storage
    .from(SUPABASE_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const previousObjectPath = existingPath ? publicStorageObjectPath(existingPath) : null;
  if (previousObjectPath && previousObjectPath !== path) {
    await admin.storage.from(SUPABASE_BUCKET).remove([previousObjectPath]);
  }

  const { data } = admin.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadImageFile(
  file: File,
  objectBasePath: string,
) {
  if (file.size === 0) throw new Error("Image file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Upload is too large. Use files up to 8MB.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported for creative photos.");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase service role is not configured.");

  const extension = extensionFromFilename(file.name);
  const version = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const path = `${objectBasePath}-${safeFilename(version)}${extension}`;
  const { error } = await admin.storage.from(SUPABASE_BUCKET).upload(path, file, {
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

async function resolveSortOrder(table: CmsTable, formData: FormData) {
  const existing = optionalNumber(formData, "existing_sort_order");
  if (existing !== null) return existing;

  const admin = await requireAdmin();
  const { data, error } = await admin
    .from(table)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const maxSortOrder = typeof data?.sort_order === "number" ? data.sort_order : -1;
  return maxSortOrder + 1;
}

function parseCsvRows(source: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(field.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (inQuotes) throw new Error("CSV has an unclosed quoted field.");

  row.push(field.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);

  return rows;
}

function normalizeHeader(value: string) {
  return value.trim().replace(/^\uFEFF/, "").toLowerCase();
}

function projectImportValue(row: Record<string, string>, key: (typeof PROJECT_IMPORT_HEADERS)[number]) {
  return row[key]?.trim() ?? "";
}

function assertAllowedProjectStatus(value: string) {
  if (!value) return null;
  if (value === "live" || value === "wip" || value === "archived") return value;
  throw new Error(`Invalid project status "${value}". Use live, wip, or archived.`);
}

function assertAllowedPhotoAspect(value: string | null) {
  if (!value) return "landscape";
  if (value === "portrait" || value === "landscape" || value === "square") return value;
  throw new Error(`Invalid photo aspect ratio "${value}".`);
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
      sort_order: await resolveSortOrder("projects", formData),
      published: bool(formData, "published"),
    },
    "slug",
  );
}

export async function importProjectsCsv(formData: FormData) {
  const admin = await requireAdmin();
  const file = formData.get("csv_file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("CSV file is required.");
  }

  if (file.size > MAX_CSV_UPLOAD_BYTES) {
    throw new Error("CSV is too large. Import up to 512KB at a time.");
  }

  const extension = extensionFromFilename(file.name);
  if (extension && extension !== ".csv") {
    throw new Error("Only CSV files are supported.");
  }

  const rows = parseCsvRows(await file.text());
  if (rows.length < 2) throw new Error("CSV must include a header row and at least one project.");

  const headers = rows[0].map(normalizeHeader);
  const missingHeaders = PROJECT_IMPORT_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(", ")}.`);
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_PROJECT_IMPORT_ROWS) {
    throw new Error(`Import up to ${MAX_PROJECT_IMPORT_ROWS} projects at a time.`);
  }

  const seenSlugs = new Set<string>();

  const { data: sortData, error: sortError } = await admin
    .from("projects")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sortError) throw sortError;

  const nextSortOrder = typeof sortData?.sort_order === "number" ? sortData.sort_order + 1 : 0;

  const importedProjects = dataRows.map((values, index) => {
    const row = Object.fromEntries(
      headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]),
    ) as Record<string, string>;

    const title = projectImportValue(row, "title");
    const slug = projectImportValue(row, "slug") || slugify(title);
    const year = projectImportValue(row, "year");
    const role = projectImportValue(row, "role");
    const description = projectImportValue(row, "description");

    if (!title) throw new Error(`Row ${index + 2}: title is required.`);
    if (!slug) throw new Error(`Row ${index + 2}: slug is required when title cannot generate one.`);
    if (!year) throw new Error(`Row ${index + 2}: year is required.`);
    if (!role) throw new Error(`Row ${index + 2}: role is required.`);
    if (!description) throw new Error(`Row ${index + 2}: description is required.`);

    if (seenSlugs.has(slug)) {
      throw new Error(`Row ${index + 2}: duplicate slug "${slug}" in CSV.`);
    }
    seenSlugs.add(slug);

    return {
      slug,
      title,
      description,
      long_description: projectImportValue(row, "long_description") || null,
      tags: parseTagsValue(projectImportValue(row, "tags")),
      github_url: projectImportValue(row, "github_url") || null,
      live_url: projectImportValue(row, "live_url") || null,
      year,
      role,
      featured: parseBoolean(projectImportValue(row, "featured")),
      status: assertAllowedProjectStatus(projectImportValue(row, "status")),
      sort_order: nextSortOrder + index,
      published: parseBoolean(projectImportValue(row, "published"), true),
    };
  });

  const existingImagesResult = await admin
    .from("projects")
    .select("slug,image_path,image_seed")
    .in("slug", importedProjects.map((project) => project.slug));

  if (existingImagesResult.error) throw existingImagesResult.error;

  const existingAssets = new Map(
    (existingImagesResult.data ?? []).map((row) => [
      row.slug,
      {
        imagePath: row.image_path as string | null,
        imageSeed: row.image_seed as string | null,
      },
    ]),
  );

  const payload = importedProjects.map((project) => {
    const existingAsset = existingAssets.get(project.slug);
    return {
      ...project,
      image_path: existingAsset?.imagePath ?? null,
      image_seed: existingAsset?.imageSeed || project.slug,
    };
  });

  const { error } = await admin.from("projects").upsert(payload, { onConflict: "slug" });
  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  redirect("/admin#projects");
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
      sort_order: await resolveSortOrder("experience_items", formData),
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
    sort_order: await resolveSortOrder("certifications", formData),
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
      sort_order: await resolveSortOrder("events", formData),
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
    sort_order: await resolveSortOrder("skill_categories", formData),
    published: bool(formData, "published"),
  });
}

export async function saveSkill(formData: FormData) {
  const id = optionalText(formData, "id");
  await mutateAndRefresh("skills", {
    ...(id ? { id } : {}),
    category_id: requiredText(formData, "category_id", "Category"),
    name: requiredText(formData, "name", "Name"),
    sort_order: await resolveSortOrder("skills", formData),
  });
}

export async function saveCreativeCategory(formData: FormData) {
  await requireAdmin();
  const name = requiredText(formData, "name", "Name");
  const slug = text(formData, "slug") || slugify(name);
  const id = optionalText(formData, "id");
  const currentSlug = optionalText(formData, "current_slug");
  await ensureUniqueByKey("creative_categories", "slug", slug, currentSlug);

  const existingImagePath = optionalText(formData, "existing_image_path");
  const image = await uploadAssetIfPresent(
    formData,
    "image_file",
    `creative/categories/${slug}/showcase`,
    existingImagePath,
  );

  await mutateAndRefresh("creative_categories", {
    ...(id ? { id } : {}),
    slug,
    name,
    description: optionalText(formData, "description"),
    showcase_image_path: image ?? existingImagePath,
    sort_order: await resolveSortOrder("creative_categories", formData),
    published: bool(formData, "published"),
  });
}

const DEFAULT_CREATIVE_CATEGORIES = [
  {
    slug: "portrait",
    name: "Portrait",
    description: "Portrait sessions, editorials, and expression-led frames.",
  },
  {
    slug: "event",
    name: "Event",
    description: "Community events, campus activations, and live coverage.",
  },
  {
    slug: "street",
    name: "Street",
    description: "Candid public-space moments, urban detail, and everyday rhythm.",
  },
  {
    slug: "creative",
    name: "Creative",
    description: "Experimental compositions, concepts, and stylized visual studies.",
  },
  {
    slug: "astrophotography",
    name: "Astrophotography",
    description: "Night-sky studies, moon captures, and long-exposure celestial work.",
  },
] as const;

export async function seedDefaultCreativeCategories() {
  const admin = await requireAdmin();
  const payload = DEFAULT_CREATIVE_CATEGORIES.map((category, index) => ({
    ...category,
    sort_order: index,
    published: true,
  }));

  const { error } = await admin
    .from("creative_categories")
    .upsert(payload, { onConflict: "slug" });

  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  redirect("/admin#creative-portfolio");
}

export async function saveCreativePhoto(formData: FormData) {
  await requireAdmin();
  const id = optionalText(formData, "id") ?? crypto.randomUUID();
  const categoryId = requiredText(formData, "category_id", "Category");
  const existingImagePath = optionalText(formData, "existing_image_path");
  const image = await uploadAssetIfPresent(
    formData,
    "image_file",
    `creative/photos/${categoryId}/${id}`,
    existingImagePath,
  );

  if (!image && !existingImagePath) throw new Error("Photo image is required.");

  await mutateAndRefresh("creative_photos", {
    id,
    category_id: categoryId,
    title: requiredText(formData, "title", "Title"),
    image_path: image ?? existingImagePath,
    aspect_ratio: assertAllowedPhotoAspect(optionalText(formData, "aspect_ratio")),
    featured: bool(formData, "featured"),
    sort_order: await resolveSortOrder("creative_photos", formData),
    published: bool(formData, "published"),
  });
}

export async function uploadCreativePhotos(formData: FormData) {
  const admin = await requireAdmin();
  const categoryId = requiredText(formData, "category_id", "Category");
  const categorySlug = requiredText(formData, "category_slug", "Category slug");
  const files = formData
    .getAll("image_files")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (files.length === 0) throw new Error("At least one image is required.");
  if (files.length > MAX_CREATIVE_UPLOAD_FILES) {
    throw new Error(`Upload up to ${MAX_CREATIVE_UPLOAD_FILES} creative photos at a time.`);
  }

  const { data: sortData, error: sortError } = await admin
    .from("creative_photos")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sortError) throw sortError;

  const nextSortOrder = typeof sortData?.sort_order === "number" ? sortData.sort_order + 1 : 0;
  const uploaded = await Promise.all(
    files.map(async (file, index) => {
      const id = crypto.randomUUID();
      const imagePath = await uploadImageFile(file, `creative/photos/${categorySlug}/${id}`);
      return {
        id,
        category_id: categoryId,
        title: titleFromFilename(file.name) || `Creative photo ${index + 1}`,
        image_path: imagePath,
        aspect_ratio: "landscape",
        featured: false,
        sort_order: nextSortOrder + index,
        published: true,
      };
    }),
  );

  const { error } = await admin.from("creative_photos").insert(uploaded);
  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  redirect("/admin#creative-portfolio");
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

export async function updateSortOrder({
  ids,
  table,
}: {
  ids: string[];
  table: SortableCmsTable;
}) {
  const admin = await requireAdmin();
  const key = SORTABLE_KEYS[table];

  if (!key) throw new Error("Unsupported sortable table.");
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !id.trim())) {
    throw new Error("Invalid sort order payload.");
  }

  const updates = ids.map((id, index) =>
    admin
      .from(table)
      .update({ sort_order: index })
      .eq(key, id),
  );

  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;

  revalidateTag("portfolio-content", "max");
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
