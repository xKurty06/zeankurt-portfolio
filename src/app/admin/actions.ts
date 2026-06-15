"use server";

import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { optimizePhotographyImage } from "@/lib/photography-image";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { isAllowedAdminEmail, PHOTOGRAPHY_BUCKET, SUPABASE_BUCKET } from "@/lib/supabase/config";

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
const MAX_GENERIC_IMPORT_ROWS = 200;
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
const EXPERIENCE_IMPORT_HEADERS = [
  "slug",
  "organization",
  "role",
  "period",
  "type",
  "description",
  "published",
] as const;
const CERTIFICATION_IMPORT_HEADERS = [
  "name",
  "issuer",
  "issued",
  "expires",
  "published",
] as const;
const EVENT_IMPORT_HEADERS = [
  "slug",
  "title",
  "event_date",
  "venue",
  "organizers",
  "role",
  "category",
  "published",
] as const;
const SKILL_IMPORT_HEADERS = [
  "category",
  "skill",
  "category_published",
] as const;

function extensionFromFilename(value: string) {
  const match = /\.[a-z0-9]+$/i.exec(value);
  return match ? match[0].toLowerCase() : "";
}

function publicStorageObjectRef(value: string) {
  const marker = "/storage/v1/object/public/";
  if (!value.includes(marker)) return null;

  const [, suffix = ""] = value.split(marker);
  const [bucket = "", ...pathParts] = suffix.split("/");
  const objectPath = pathParts.join("/");

  if (!bucket || !objectPath) return null;
  return { bucket, objectPath };
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

function shouldRedirectAfterAction(formData: FormData) {
  return text(formData, "keep_modal_open") !== "1";
}

function redirectAfterAction(formData: FormData, href = "/admin") {
  if (shouldRedirectAfterAction(formData)) {
    redirect(href);
  }
}

function mutationOptionsForForm(formData: FormData) {
  return {
    redirect: shouldRedirectAfterAction(formData),
  };
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

function categoryTitleFromSlug(value: string) {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function padSequence(value: number) {
  return String(value).padStart(4, "0");
}

async function optimizeImageUpload(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const input = Buffer.from(arrayBuffer);
  const contentType = file.type || "application/octet-stream";

  if (!contentType.startsWith("image/")) {
    return { bytes: input, contentType };
  }

  const optimized = await optimizePhotographyImage(input, contentType);
  return { bytes: optimized.bytes, contentType: optimized.contentType };
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
  bucket = SUPABASE_BUCKET,
) {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;

  const allowed = file.type.startsWith("image/") || file.type === "application/pdf";
  if (!allowed) throw new Error("Only images and PDFs are supported.");

  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase service role is not configured.");

  const processed = file.type.startsWith("image/") ? await optimizeImageUpload(file) : { bytes: await file.arrayBuffer(), contentType: file.type };
  if (processed.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Upload is too large after optimization. Use images that compress below 8MB.");
  }
  const extension = extensionFromFilename(file.name);
  const version = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const path = `${objectBasePath}-${safeFilename(version)}${extension}`;
  const { error } = await admin.storage
    .from(bucket)
    .upload(path, processed.bytes, {
      cacheControl: "31536000",
      upsert: false,
      contentType: processed.contentType,
    });

  if (error) throw error;

  const previousObjectRef = existingPath ? publicStorageObjectRef(existingPath) : null;
  if (previousObjectRef && (previousObjectRef.bucket !== bucket || previousObjectRef.objectPath !== path)) {
    await admin.storage.from(previousObjectRef.bucket).remove([previousObjectRef.objectPath]);
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadImageFile(
  file: File,
  objectBasePath: string,
  bucket = SUPABASE_BUCKET,
) {
  if (file.size === 0) throw new Error("Image file is empty.");
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported for creative photos.");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase service role is not configured.");

  const input = Buffer.from(await file.arrayBuffer());
  const processed = await optimizePhotographyImage(input, file.type || "application/octet-stream");
  if (processed.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Upload is too large after optimization. Use images that compress below 8MB.");
  }
  const { error } = await admin.storage.from(bucket).upload(objectBasePath, processed.bytes, {
    cacheControl: "31536000",
    upsert: false,
    contentType: processed.contentType,
  });

  if (error) throw error;

  const { data } = admin.storage.from(bucket).getPublicUrl(objectBasePath);
  return { aspectRatio: processed.aspectRatio, imagePath: data.publicUrl };
}

async function uploadCreativePhotoIfPresent(
  formData: FormData,
  field: string,
  objectBasePath: string,
  bucket = PHOTOGRAPHY_BUCKET,
) {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;

  const extension = extensionFromFilename(file.name);
  const version = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  return uploadImageFile(file, `${objectBasePath}-${safeFilename(version)}${extension}`, bucket);
}

async function mutateAndRefresh<T extends Record<string, unknown>>(
  table: CmsTable,
  payload: T,
  conflictTarget?: string,
  options?: { redirect?: boolean },
) {
  const admin = await requireAdmin();
  const query = conflictTarget
    ? admin.from(table).upsert(payload, { onConflict: conflictTarget })
    : admin.from(table).upsert(payload);

  const { error } = await query;
  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  revalidatePath("/admin");

  if (options?.redirect !== false) {
    redirect("/admin");
  }
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

function assertAllowedExperienceType(value: string) {
  if (value === "work" || value === "community" || value === "hackathon") return value;
  throw new Error(`Invalid experience type "${value}". Use work, community, or hackathon.`);
}

function assertAllowedEventCategory(value: string) {
  if (!value) return null;
  if (value === "community" || value === "hackathon" || value === "meetup" || value === "conference" || value === "workshop") {
    return value;
  }
  throw new Error(`Invalid event category "${value}".`);
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
    mutationOptionsForForm(formData),
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
  if (rows.length < 2) {
    const singleRow = rows[0] ?? [];
    const headerCandidate = singleRow.map(normalizeHeader);
    const isHeaderOnly = headerCandidate.length === PROJECT_IMPORT_HEADERS.length &&
      headerCandidate.every((value) => PROJECT_IMPORT_HEADERS.includes(value as typeof PROJECT_IMPORT_HEADERS[number]));

    if (rows.length === 1 && singleRow.length === PROJECT_IMPORT_HEADERS.length && !isHeaderOnly) {
      rows.unshift(PROJECT_IMPORT_HEADERS.slice());
    } else {
      throw new Error("CSV must include a header row and at least one project.");
    }
  }

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
  redirectAfterAction(formData, "/admin#projects");
}

export async function importExperienceCsv(formData: FormData) {
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
  if (rows.length < 2) throw new Error("CSV must include a header row and at least one experience record.");

  const headers = rows[0].map(normalizeHeader);
  const missingHeaders = EXPERIENCE_IMPORT_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(", ")}.`);
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_GENERIC_IMPORT_ROWS) {
    throw new Error(`Import up to ${MAX_GENERIC_IMPORT_ROWS} experience records at a time.`);
  }

  const seenSlugs = new Set<string>();
  const { data: sortData, error: sortError } = await admin
    .from("experience_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sortError) throw sortError;
  const nextSortOrder = typeof sortData?.sort_order === "number" ? sortData.sort_order + 1 : 0;

  const payload = dataRows.map((values, index) => {
    const row = Object.fromEntries(
      headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]),
    ) as Record<string, string>;

    const organization = row.organization?.trim() ?? "";
    const slug = (row.slug?.trim() || slugify(organization));
    const role = row.role?.trim() ?? "";
    const period = row.period?.trim() ?? "";
    const description = row.description?.trim() ?? "";
    const type = row.type?.trim() ?? "";

    if (!organization) throw new Error(`Row ${index + 2}: organization is required.`);
    if (!slug) throw new Error(`Row ${index + 2}: slug is required when organization cannot generate one.`);
    if (!role) throw new Error(`Row ${index + 2}: role is required.`);
    if (!period) throw new Error(`Row ${index + 2}: period is required.`);
    if (!description) throw new Error(`Row ${index + 2}: description is required.`);
    if (!type) throw new Error(`Row ${index + 2}: type is required.`);
    if (seenSlugs.has(slug)) throw new Error(`Row ${index + 2}: duplicate slug "${slug}" in CSV.`);
    seenSlugs.add(slug);

    return {
      slug,
      organization,
      role,
      period,
      description,
      type: assertAllowedExperienceType(type),
      sort_order: nextSortOrder + index,
      published: parseBoolean(row.published ?? "", true),
    };
  });

  const { error } = await admin.from("experience_items").upsert(payload, { onConflict: "slug" });
  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  redirectAfterAction(formData, "/admin#experience");
}

export async function importCertificationsCsv(formData: FormData) {
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
  if (rows.length < 2) throw new Error("CSV must include a header row and at least one certification.");

  const headers = rows[0].map(normalizeHeader);
  const missingHeaders = CERTIFICATION_IMPORT_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(", ")}.`);
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_GENERIC_IMPORT_ROWS) {
    throw new Error(`Import up to ${MAX_GENERIC_IMPORT_ROWS} certifications at a time.`);
  }

  const existingResult = await admin.from("certifications").select("id,name,issuer,image_path,sort_order");
  if (existingResult.error) throw existingResult.error;
  const existingMap = new Map(
    (existingResult.data ?? []).map((row) => [`${row.name}::${row.issuer}`.toLowerCase(), row]),
  );
  const seenKeys = new Set<string>();

  const { data: sortData, error: sortError } = await admin
    .from("certifications")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sortError) throw sortError;
  let nextSortOrder = typeof sortData?.sort_order === "number" ? sortData.sort_order + 1 : 0;

  const payload = dataRows.map((values, index) => {
    const row = Object.fromEntries(
      headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]),
    ) as Record<string, string>;

    const name = row.name?.trim() ?? "";
    const issuer = row.issuer?.trim() ?? "";
    if (!name) throw new Error(`Row ${index + 2}: name is required.`);
    if (!issuer) throw new Error(`Row ${index + 2}: issuer is required.`);

    const compositeKey = `${name}::${issuer}`.toLowerCase();
    if (seenKeys.has(compositeKey)) {
      throw new Error(`Row ${index + 2}: duplicate certification "${name}" from "${issuer}" in CSV.`);
    }
    seenKeys.add(compositeKey);

    const existing = existingMap.get(compositeKey);
    return {
      id: existing?.id ?? crypto.randomUUID(),
      name,
      issuer,
      issued: row.issued?.trim() || null,
      expires: row.expires?.trim() || null,
      image_path: existing?.image_path ?? null,
      sort_order: existing?.sort_order ?? nextSortOrder++,
      published: parseBoolean(row.published ?? "", true),
    };
  });

  const { error } = await admin.from("certifications").upsert(payload);
  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  redirectAfterAction(formData, "/admin#certifications");
}

export async function importEventsCsv(formData: FormData) {
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
  if (rows.length < 2) throw new Error("CSV must include a header row and at least one event.");

  const headers = rows[0].map(normalizeHeader);
  const missingHeaders = EVENT_IMPORT_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(", ")}.`);
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_GENERIC_IMPORT_ROWS) {
    throw new Error(`Import up to ${MAX_GENERIC_IMPORT_ROWS} events at a time.`);
  }

  const seenSlugs = new Set<string>();
  const existingResult = await admin.from("events").select("slug,image_path,sort_order");
  if (existingResult.error) throw existingResult.error;
  const existingMap = new Map((existingResult.data ?? []).map((row) => [row.slug, row]));

  const { data: sortData, error: sortError } = await admin
    .from("events")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sortError) throw sortError;
  let nextSortOrder = typeof sortData?.sort_order === "number" ? sortData.sort_order + 1 : 0;

  const payload = dataRows.map((values, index) => {
    const row = Object.fromEntries(
      headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]),
    ) as Record<string, string>;

    const title = row.title?.trim() ?? "";
    const slug = row.slug?.trim() || slugify(title);
    const eventDate = row.event_date?.trim() ?? "";
    const venue = row.venue?.trim() ?? "";

    if (!title) throw new Error(`Row ${index + 2}: title is required.`);
    if (!slug) throw new Error(`Row ${index + 2}: slug is required when title cannot generate one.`);
    if (!eventDate) throw new Error(`Row ${index + 2}: event_date is required.`);
    if (!venue) throw new Error(`Row ${index + 2}: venue is required.`);
    if (Number.isNaN(Date.parse(`${eventDate}T00:00:00`))) {
      throw new Error(`Row ${index + 2}: event_date must be a valid date in YYYY-MM-DD format.`);
    }
    if (seenSlugs.has(slug)) throw new Error(`Row ${index + 2}: duplicate slug "${slug}" in CSV.`);
    seenSlugs.add(slug);

    const existing = existingMap.get(slug);
    return {
      slug,
      title,
      event_date: eventDate,
      year: new Date(`${eventDate}T00:00:00`).getFullYear().toString(),
      venue,
      organizers: row.organizers?.trim() || null,
      role: row.role?.trim() || null,
      category: assertAllowedEventCategory(row.category?.trim() ?? ""),
      image_path: existing?.image_path ?? null,
      sort_order: existing?.sort_order ?? nextSortOrder++,
      published: parseBoolean(row.published ?? "", true),
    };
  });

  const { error } = await admin.from("events").upsert(payload, { onConflict: "slug" });
  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  redirectAfterAction(formData, "/admin#events");
}

export async function importSkillsCsv(formData: FormData) {
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
  if (rows.length < 2) throw new Error("CSV must include a header row and at least one skill.");

  const headers = rows[0].map(normalizeHeader);
  const missingHeaders = SKILL_IMPORT_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(", ")}.`);
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_GENERIC_IMPORT_ROWS) {
    throw new Error(`Import up to ${MAX_GENERIC_IMPORT_ROWS} skills at a time.`);
  }

  const categoriesResult = await admin.from("skill_categories").select("id,name,published,sort_order");
  if (categoriesResult.error) throw categoriesResult.error;
  const skillsResult = await admin.from("skills").select("id,category_id,name,sort_order");
  if (skillsResult.error) throw skillsResult.error;

  const categoriesByName = new Map(
    (categoriesResult.data ?? []).map((row) => [row.name.toLowerCase(), row]),
  );
  const existingSkills = new Set(
    (skillsResult.data ?? []).map((row) => `${row.category_id}::${row.name.toLowerCase()}`),
  );

  const { data: categorySortData, error: categorySortError } = await admin
    .from("skill_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (categorySortError) throw categorySortError;
  let nextCategorySortOrder = typeof categorySortData?.sort_order === "number" ? categorySortData.sort_order + 1 : 0;

  const { data: skillSortData, error: skillSortError } = await admin
    .from("skills")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (skillSortError) throw skillSortError;
  let nextSkillSortOrder = typeof skillSortData?.sort_order === "number" ? skillSortData.sort_order + 1 : 0;

  const categoriesToUpsert: Array<{ id: string; name: string; published: boolean; sort_order: number }> = [];
  const skillsToInsert: Array<{ id: string; category_id: string; name: string; sort_order: number }> = [];
  const seenCsvRows = new Set<string>();

  for (let index = 0; index < dataRows.length; index += 1) {
    const values = dataRows[index];
    const row = Object.fromEntries(
      headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]),
    ) as Record<string, string>;

    const categoryName = row.category?.trim() ?? "";
    const skillName = row.skill?.trim() ?? "";
    if (!categoryName) throw new Error(`Row ${index + 2}: category is required.`);
    if (!skillName) throw new Error(`Row ${index + 2}: skill is required.`);

    const csvKey = `${categoryName.toLowerCase()}::${skillName.toLowerCase()}`;
    if (seenCsvRows.has(csvKey)) throw new Error(`Row ${index + 2}: duplicate skill "${skillName}" in category "${categoryName}" in CSV.`);
    seenCsvRows.add(csvKey);

    const normalizedCategory = categoryName.toLowerCase();
    let category = categoriesByName.get(normalizedCategory);

    if (!category) {
      category = {
        id: crypto.randomUUID(),
        name: categoryName,
        published: parseBoolean(row.category_published ?? "", true),
        sort_order: nextCategorySortOrder++,
      };
      categoriesByName.set(normalizedCategory, category);
      categoriesToUpsert.push(category);
    }

    const skillKey = `${category.id}::${skillName.toLowerCase()}`;
    if (existingSkills.has(skillKey)) continue;

    existingSkills.add(skillKey);
    skillsToInsert.push({
      id: crypto.randomUUID(),
      category_id: category.id,
      name: skillName,
      sort_order: nextSkillSortOrder++,
    });
  }

  if (categoriesToUpsert.length > 0) {
    const { error } = await admin.from("skill_categories").upsert(categoriesToUpsert);
    if (error) throw error;
  }
  if (skillsToInsert.length > 0) {
    const { error } = await admin.from("skills").insert(skillsToInsert);
    if (error) throw error;
  }

  revalidateTag("portfolio-content", "max");
  redirectAfterAction(formData, "/admin#skills");
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
    mutationOptionsForForm(formData),
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

  await mutateAndRefresh(
    "certifications",
    {
      id,
      name,
      issuer,
      issued: optionalText(formData, "issued"),
      expires: optionalText(formData, "expires"),
      image_path: image ?? existingImagePath,
      sort_order: await resolveSortOrder("certifications", formData),
      published: bool(formData, "published"),
    },
    undefined,
    mutationOptionsForForm(formData),
  );
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
    mutationOptionsForForm(formData),
  );
}


export async function saveSkillCategory(formData: FormData) {
  const id = optionalText(formData, "id");

  await mutateAndRefresh(
    "skill_categories",
    {
      ...(id ? { id } : {}),
      name: requiredText(formData, "name", "Name"),
      sort_order: await resolveSortOrder("skill_categories", formData),
      published: bool(formData, "published"),
    },
    undefined,
    mutationOptionsForForm(formData),
  );
}


export async function saveSkill(formData: FormData) {
  const id = optionalText(formData, "id");

  await mutateAndRefresh(
    "skills",
    {
      ...(id ? { id } : {}),
      category_id: requiredText(formData, "category_id", "Category"),
      name: requiredText(formData, "name", "Name"),
      sort_order: await resolveSortOrder("skills", formData),
    },
    undefined,
    mutationOptionsForForm(formData),
  );
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
    `${slug}/showcase`,
    existingImagePath,
    PHOTOGRAPHY_BUCKET,
  );

  await mutateAndRefresh(
    "creative_categories",
    {
      ...(id ? { id } : {}),
      slug,
      name,
      description: optionalText(formData, "description"),
      showcase_image_path: image ?? existingImagePath,
      sort_order: await resolveSortOrder("creative_categories", formData),
      published: bool(formData, "published"),
    },
    undefined,
    mutationOptionsForForm(formData),
  );
}


const DEFAULT_CREATIVE_CATEGORIES = [
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

  const uploadedPhoto = await uploadCreativePhotoIfPresent(
    formData,
    "image_file",
    `${text(formData, "category_slug") || categoryId}/${id}`,
    PHOTOGRAPHY_BUCKET,
  );

  if (!uploadedPhoto && !existingImagePath) {
    throw new Error("Photo image is required.");
  }

  await mutateAndRefresh(
    "creative_photos",
    {
      id,
      category_id: categoryId,
      title: requiredText(formData, "title", "Title"),
      image_path: uploadedPhoto?.imagePath ?? existingImagePath,
      aspect_ratio: uploadedPhoto?.aspectRatio ?? assertAllowedPhotoAspect(optionalText(formData, "aspect_ratio")),
      featured: bool(formData, "featured"),
      sort_order: await resolveSortOrder("creative_photos", formData),
      published: bool(formData, "published"),
    },
    undefined,
    mutationOptionsForForm(formData),
  );
}


export async function uploadCreativePhotos(formData: FormData) {
  const admin = await requireAdmin();
  const categoryId = requiredText(formData, "category_id", "Category");
  const categorySlug = requiredText(formData, "category_slug", "Category slug");
  const files = formData
    .getAll("image_files")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (files.length === 0) throw new Error("At least one image is required.");
  // Process large uploads in sequential batches to avoid request failures
  // (client may attempt to upload entire folders — handle them gracefully).

  const { data: sortData, error: sortError } = await admin
    .from("creative_photos")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sortError) throw sortError;

  const nextSortOrder = typeof sortData?.sort_order === "number" ? sortData.sort_order + 1 : 0;
  const uploaded: Array<Record<string, unknown>> = [];
  // Choose a batch size equal to MAX_CREATIVE_UPLOAD_FILES to limit memory and
  // processing concurrency on the server. Process batches sequentially.
  for (let offset = 0; offset < files.length; offset += MAX_CREATIVE_UPLOAD_FILES) {
    const batch = files.slice(offset, offset + MAX_CREATIVE_UPLOAD_FILES);
    const batchUploaded = await Promise.all(
      batch.map(async (file, batchIndex) => {
        const overallIndex = offset + batchIndex;
        const id = crypto.randomUUID();
        const sequence = nextSortOrder + overallIndex + 1;
        const sequenceLabel = padSequence(sequence);
        const extension = extensionFromFilename(file.name);
        const uploadedPhoto = await uploadImageFile(
          file,
          `${categorySlug}/${categorySlug}-${sequenceLabel}${extension}`,
          PHOTOGRAPHY_BUCKET,
        );
        return {
          id,
          category_id: categoryId,
          title: `${categoryTitleFromSlug(categorySlug)} ${sequence}`,
          image_path: uploadedPhoto.imagePath,
          aspect_ratio: uploadedPhoto.aspectRatio,
          featured: false,
          sort_order: nextSortOrder + overallIndex,
          published: true,
        };
      }),
    );

    uploaded.push(...batchUploaded);
  }

  const { error } = await admin.from("creative_photos").insert(uploaded);
  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  redirect("/admin#creative-portfolio");
}

export async function deleteCreativePhotos(formData: FormData) {
  const rawIds = text(formData, "ids");
  const parsed = JSON.parse(rawIds || "[]");

  if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== "string" || !id.trim())) {
    throw new Error("Invalid photo selection.");
  }

  const ids = Array.from(new Set(parsed.map((id) => id.trim()))).filter(Boolean);
  await deleteCreativePhotosByIds(ids);
  redirect("/admin#creative-portfolio");
}

export async function deleteCreativePhotosByIds(ids: string[]) {
  const admin = await requireAdmin();

  if (ids.length === 0) {
    throw new Error("Select at least one photo to remove.");
  }

  const { data, error } = await admin
    .from("creative_photos")
    .select("id,image_path")
    .in("id", ids);

  if (error) throw error;

  const objectRefs = (data ?? [])
    .map((row) => publicStorageObjectRef(typeof row.image_path === "string" ? row.image_path : ""))
    .filter((ref): ref is { bucket: string; objectPath: string } => Boolean(ref));

  const { error: deleteError } = await admin.from("creative_photos").delete().in("id", ids);
  if (deleteError) throw deleteError;

  if (objectRefs.length > 0) {
    const refsByBucket = new Map<string, string[]>();
    objectRefs.forEach((ref) => {
      refsByBucket.set(ref.bucket, [...(refsByBucket.get(ref.bucket) ?? []), ref.objectPath]);
    });
    await Promise.all(
      Array.from(refsByBucket.entries()).map(([bucket, objectPaths]) =>
        admin.storage.from(bucket).remove(objectPaths),
      ),
    );
  }

  revalidateTag("portfolio-content", "max");
  return { deletedIds: ids };
}

export async function saveSiteContent(formData: FormData) {
  const admin = await requireAdmin();

  const key = requiredText(formData, "key", "Key");
  const rawValue = requiredText(formData, "value", "Value");

  let value: unknown;

  try {
    value = JSON.parse(rawValue);
  } catch {
    throw new Error("Invalid JSON. Please check your site content value.");
  }

  const { error } = await admin
    .from("site_content")
    .upsert({ key, value }, { onConflict: "key" });

  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  revalidatePath("/");
  revalidatePath("/photography");
  revalidatePath("/admin");

  redirectAfterAction(formData, "/admin#site-content");
}

const DELETE_KEYS: Record<CmsTable, "slug" | "id"> = {
  projects: "slug",
  experience_items: "slug",
  certifications: "id",
  events: "slug",
  skill_categories: "id",
  skills: "id",
  creative_categories: "id",
  creative_photos: "id",
};

function assertCmsTable(value: string): asserts value is CmsTable {
  const allowedTables: CmsTable[] = [
    "projects",
    "experience_items",
    "certifications",
    "events",
    "skill_categories",
    "skills",
    "creative_categories",
    "creative_photos",
  ];

  if (!allowedTables.includes(value as CmsTable)) {
    throw new Error("Invalid table.");
  }
}

function assertSortableCmsTable(value: string): asserts value is SortableCmsTable {
  const allowedTables: SortableCmsTable[] = [
    "projects",
    "experience_items",
    "certifications",
    "events",
    "skill_categories",
    "creative_categories",
    "creative_photos",
  ];

  if (!allowedTables.includes(value as SortableCmsTable)) {
    throw new Error("Invalid sortable table.");
  }
}

export async function deleteRecord(formData: FormData) {
  const admin = await requireAdmin();

  const table = requiredText(formData, "table", "Table");
  const id = requiredText(formData, "id", "Record ID");

  assertCmsTable(table);

  const key = DELETE_KEYS[table];

  const { error } = await admin.from(table).delete().eq(key, id);

  if (error) throw error;

  revalidateTag("portfolio-content", "max");
  revalidatePath("/");
  revalidatePath("/photography");
  revalidatePath("/admin");

  redirectAfterAction(formData, "/admin");
}

export async function updateSortOrder({
  table,
  ids,
}: {
  table: SortableCmsTable;
  ids: string[];
}) {
  const admin = await requireAdmin();

  assertSortableCmsTable(table);

  const key = SORTABLE_KEYS[table];

  const updates = ids.map((id, index) =>
    admin.from(table).update({ sort_order: index }).eq(key, id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw failed.error;
  }

  revalidateTag("portfolio-content", "max");
  revalidatePath("/");
  revalidatePath("/photography");
  revalidatePath("/admin");
}