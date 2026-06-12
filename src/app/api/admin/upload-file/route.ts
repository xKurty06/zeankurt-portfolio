import { NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail, SUPABASE_BUCKET } from "@/lib/supabase/config";

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

function titleFromFilename(value: string) {
  return value
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function optimizeImage(buffer: Buffer, mime = "image/jpeg") {
  try {
    const image = sharp(buffer).rotate();
    const metadata = await image.metadata();
    const resizeOptions = { width: 2048, height: 2048, fit: "inside", withoutEnlargement: true } as any;

    switch (metadata.format) {
      case "jpeg":
      case "jpg":
        return { bytes: await image.resize(resizeOptions).jpeg({ quality: 82, mozjpeg: true }).toBuffer(), contentType: "image/jpeg" };
      case "png":
        return { bytes: await image.resize(resizeOptions).png({ compressionLevel: 8, adaptiveFiltering: true, effort: 6 }).toBuffer(), contentType: "image/png" };
      case "webp":
        return { bytes: await image.resize(resizeOptions).webp({ quality: 80 }).toBuffer(), contentType: "image/webp" };
      case "avif":
        return { bytes: await image.resize(resizeOptions).avif({ quality: 60 }).toBuffer(), contentType: "image/avif" };
      default:
        return { bytes: buffer, contentType: mime };
    }
  } catch (err) {
    return { bytes: buffer, contentType: mime };
  }
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
  const processed = file.type.startsWith("image/") ? await optimizeImage(input, file.type) : { bytes: input, contentType: file.type || "application/octet-stream" };

  const id = crypto.randomUUID();
  const extension = extensionFromFilename(file.name) || "";
  const path = `creative/photos/${String(categorySlug)}/${id}-${safeFilename(file.name)}`;

  const { error: uploadError } = await admin.storage.from(SUPABASE_BUCKET).upload(path, processed.bytes, { cacheControl: "31536000", upsert: false, contentType: processed.contentType });
  if (uploadError) return NextResponse.json({ error: uploadError.message || uploadError }, { status: 500 });

  const { data: publicData } = admin.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  const publicUrl = publicData?.publicUrl ?? null;

  // determine sort_order
  const { data: sortData, error: sortError } = await admin.from("creative_photos").select("sort_order").eq("category_id", String(categoryId)).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  if (sortError) return NextResponse.json({ error: sortError.message || sortError }, { status: 500 });
  const nextSortOrder = typeof sortData?.sort_order === "number" ? sortData.sort_order + 1 : 0;

  const payload = {
    id,
    category_id: String(categoryId),
    title: titleFromFilename(file.name) || `Creative photo`,
    image_path: publicUrl,
    aspect_ratio: "landscape",
    featured: false,
    sort_order: nextSortOrder,
    published: true,
  } as any;

  const { error: insertError } = await admin.from("creative_photos").insert(payload);
  if (insertError) return NextResponse.json({ error: insertError.message || insertError }, { status: 500 });

  return NextResponse.json({ id, image_path: publicUrl });
}
