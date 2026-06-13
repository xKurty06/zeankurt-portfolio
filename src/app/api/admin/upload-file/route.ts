import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { optimizePhotographyImage } from "@/lib/photography-image";
import { isAllowedAdminEmail, PHOTOGRAPHY_BUCKET } from "@/lib/supabase/config";

function extensionFromFilename(value: string) {
  const match = /\.[a-z0-9]+$/i.exec(value);
  return match ? match[0].toLowerCase() : "";
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function isStorageConflict(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error ? String((error as { message?: unknown }).message ?? "") : String(error ?? "");
  return /duplicate|already exists|conflict/i.test(message);
}

function isUniqueConstraintError(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message =
    typeof error === "object" && error && "message" in error ? String((error as { message?: unknown }).message ?? "") : String(error ?? "");
  return code === "23505" || /duplicate key|unique constraint/i.test(message);
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");
  const categoryId = formData.get("category_id");
  const categorySlug = formData.get("category_slug");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  // Basic auth: ensure request comes from an authenticated admin user
  const server = await createSupabaseServerClient();
  const { data: { user } } = server ? await server.auth.getUser() : { data: { user: null } };
  if (!user || !isAllowedAdminEmail(user.email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "server not configured" }, { status: 500 });

  const arrayBuffer = await file.arrayBuffer();
  const input = Buffer.from(arrayBuffer);
  const processed = file.type.startsWith("image/")
    ? await optimizePhotographyImage(input, file.type)
    : { aspectRatio: "landscape" as const, bytes: input, contentType: file.type || "application/octet-stream" };

  // determine sort_order
  const { data: sortData, error: sortError } = await admin.from("creative_photos").select("sort_order").eq("category_id", String(categoryId)).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  if (sortError) return NextResponse.json({ error: sortError.message || sortError }, { status: 500 });
  const baseSortOrder = typeof sortData?.sort_order === "number" ? sortData.sort_order + 1 : 0;
  const safeCategorySlug = safeFilename(String(categorySlug || "creative"));
  const extension = extensionFromFilename(file.name) || "";

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const nextSortOrder = baseSortOrder + attempt;
    const nextSequence = nextSortOrder + 1;
    const sequenceLabel = padSequence(nextSequence);
    const title = `${categoryTitleFromSlug(safeCategorySlug)} ${nextSequence}`;
    const path = `${safeCategorySlug}/${safeCategorySlug}-${sequenceLabel}${extension}`;
    const id = crypto.randomUUID();

    const { error: uploadError } = await admin.storage
      .from(PHOTOGRAPHY_BUCKET)
      .upload(path, processed.bytes, { cacheControl: "31536000", upsert: false, contentType: processed.contentType });

    if (uploadError) {
      if (isStorageConflict(uploadError)) {
        continue;
      }

      return NextResponse.json({ error: uploadError.message || uploadError }, { status: 500 });
    }

    const { data: publicData } = admin.storage.from(PHOTOGRAPHY_BUCKET).getPublicUrl(path);
    const publicUrl = publicData?.publicUrl ?? null;

    const payload = {
      id,
      category_id: String(categoryId),
      title,
      image_path: publicUrl,
      aspect_ratio: processed.aspectRatio,
      featured: false,
      sort_order: nextSortOrder,
      published: true,
    } as any;

    const { error: insertError } = await admin.from("creative_photos").insert(payload);
    if (!insertError) {
      return NextResponse.json({ id, image_path: publicUrl });
    }

    await admin.storage.from(PHOTOGRAPHY_BUCKET).remove([path]);

    if (isUniqueConstraintError(insertError)) {
      continue;
    }

    return NextResponse.json({ error: insertError.message || insertError }, { status: 500 });
  }

  return NextResponse.json(
    { error: "Could not assign a unique filename and sequence for this upload." },
    { status: 500 },
  );
}
