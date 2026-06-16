// npm run optimize:images

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const root = process.cwd();
const DEFAULT_BUCKET = process.env.SUPABASE_BUCKET || "portfolio-assets";
const PHOTOGRAPHY_BUCKET = process.env.PHOTOGRAPHY_BUCKET || "photography";

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

loadEnvFile(".env.local");
loadEnvFile(".env");

function requiredEnv(name) {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is required`);
    return value;
}

function publicStorageObjectPath(value, bucket) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    if (!value || typeof value !== "string") return null;
    if (value.includes(marker)) {
        const [, objectPath = ""] = value.split(marker);
        return objectPath || null;
    }

    if (/^https?:\/\//i.test(value)) return null;

    return value.replace(/^\/+/, "") || null;
}

function bytesToKb(bytes) {
    return `${(bytes / 1024).toFixed(1)} KB`;
}

async function bufferFromDownload(data) {
    if (!data) return null;
    if (typeof data.arrayBuffer === "function") {
        return Buffer.from(await data.arrayBuffer());
    }
    if (typeof data.stream === "function") {
        const stream = data.stream();
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    throw new Error("Unable to convert downloaded data to a buffer.");
}

function formatToContentType(format) {
    switch (format) {
        case "jpeg":
            return "image/jpeg";
        case "png":
            return "image/png";
        case "webp":
            return "image/webp";
        case "avif":
            return "image/avif";
        default:
            return null;
    }
}

async function optimizeImageBuffer(input) {
    const image = sharp(input).rotate();
    const metadata = await image.metadata();
    const format = metadata.format;
    const supportedFormats = new Set(["jpeg", "png", "webp", "avif"]);

    if (!format || !supportedFormats.has(format)) {
        return { buffer: input, contentType: null, optimized: false };
    }

    const resizeOptions = {
        width: 1800,
        height: 1800,
        fit: "inside",
        withoutEnlargement: true,
    };

    let buffer;
    switch (format) {
        case "jpeg":
            buffer = await image.resize(resizeOptions).jpeg({ quality: 76, mozjpeg: true }).toBuffer();
            break;
        case "png":
            buffer = await image
                .resize(resizeOptions)
                .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 9, palette: true, quality: 80 })
                .toBuffer();
            break;
        case "webp":
            buffer = await image.resize(resizeOptions).webp({ quality: 74 }).toBuffer();
            break;
        case "avif":
            buffer = await image.resize(resizeOptions).avif({ quality: 50 }).toBuffer();
            break;
        default:
            return { buffer: input, contentType: null, optimized: false };
    }

    const contentType = formatToContentType(format);
    return { buffer, contentType, optimized: true };
}

const OBJECT_SOURCE_TABLES = [
    { table: "projects", identifier: "slug", imageColumns: ["image_path"], bucket: DEFAULT_BUCKET },
    { table: "certifications", identifier: "id", imageColumns: ["image_path"], bucket: DEFAULT_BUCKET },
    { table: "events", identifier: "slug", imageColumns: ["image_path"], bucket: DEFAULT_BUCKET },
    { table: "creative_categories", identifier: "id", imageColumns: ["showcase_image_path"], bucket: DEFAULT_BUCKET },
    { table: "creative_photos", identifier: "id", imageColumns: ["image_path"], bucket: PHOTOGRAPHY_BUCKET },
];

async function optimizeObject(admin, bucket, objectPath) {
    const { data, error } = await admin.storage.from(bucket).download(objectPath);
    if (error) {
        console.error(`Failed to download ${objectPath}:`, error.message || error);
        return false;
    }

    const inputBuffer = await bufferFromDownload(data);
    if (!inputBuffer) {
        console.error(`Unable to read downloaded object ${objectPath}.`);
        return false;
    }

    const { buffer, contentType, optimized } = await optimizeImageBuffer(inputBuffer);
    if (!optimized || !contentType) {
        console.log(`Skipped ${objectPath} — unsupported image format or optimization not applicable.`);
        return false;
    }

    if (buffer.length >= inputBuffer.length) {
        console.log(`Skipped ${objectPath} — already optimized (${bytesToKb(inputBuffer.length)}).`);
        return false;
    }

    const { error: uploadError } = await admin.storage.from(bucket).upload(objectPath, buffer, {
        upsert: true,
        cacheControl: "31536000",
        contentType,
    });
    if (uploadError) {
        console.error(`Failed to upload optimized ${objectPath}:`, uploadError.message || uploadError);
        return false;
    }

    console.log(
        `Optimized ${objectPath}: ${bytesToKb(inputBuffer.length)} → ${bytesToKb(buffer.length)} (${(
            (1 - buffer.length / inputBuffer.length) * 100
        ).toFixed(1)}% saved)`,
    );
    return true;
}

async function main() {
    const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SECRET_KEY ||
        requiredEnv("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY");

    const admin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const processedPaths = new Set();
    let optimizedCount = 0;
    let skippedCount = 0;

    for (const tableConfig of OBJECT_SOURCE_TABLES) {
        const selectColumns = [tableConfig.identifier, ...tableConfig.imageColumns].join(",");
        const { data, error } = await admin.from(tableConfig.table).select(selectColumns);
        if (error) throw error;

        for (const row of data ?? []) {
            for (const imageColumn of tableConfig.imageColumns) {
                const source = row[imageColumn];
                if (!source || typeof source !== "string") continue;

                const objectPath = publicStorageObjectPath(source, tableConfig.bucket);
                if (!objectPath) {
                    console.log(`Skipping ${tableConfig.table}.${imageColumn} ${row[tableConfig.identifier]} — not a public bucket URL.`);
                    skippedCount += 1;
                    continue;
                }

                const processedKey = `${tableConfig.bucket}:${objectPath}`;
                if (processedPaths.has(processedKey)) {
                    continue;
                }

                processedPaths.add(processedKey);
                const optimized = await optimizeObject(admin, tableConfig.bucket, objectPath);
                if (optimized) optimizedCount += 1;
                else skippedCount += 1;
            }
        }
    }

    console.log(`\nFinished image optimization. Optimized: ${optimizedCount}, skipped: ${skippedCount}.`);
}

main().catch((error) => {
    console.error("Optimization failed:", error);
    process.exit(1);
});
