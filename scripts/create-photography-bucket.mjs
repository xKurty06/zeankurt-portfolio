import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const BUCKET = process.env.PHOTOGRAPHY_BUCKET || "photography";

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

loadEnvFile('.env.local');
loadEnvFile('.env');

function requiredEnv(name) {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is required`);
    return value;
}

async function main() {
    const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || requiredEnv("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY");

    const admin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    // Create bucket if missing
    try {
        console.log(`Ensuring bucket \"${BUCKET}\" exists...`);
        await admin.storage.createBucket(BUCKET, { public: true });
        console.log(`Bucket ${BUCKET} created (or already existed).`);
    } catch (err) {
        // supabase-js throws if bucket exists; ignore
        console.log(`Bucket create encountered: ${err.message || err}. Proceeding.`);
    }

    const categories = ["portraits", "events", "street-photography", "creative-shots", "astrophotography"];

    for (const slug of categories) {
        const objectPath = `${slug}/.keep`;
        const content = Buffer.from("created by setup script\n");
        try {
            const { error } = await admin.storage.from(BUCKET).upload(objectPath, content, { upsert: true, contentType: "text/plain" });
            if (error) throw error;
            console.log(`Created folder placeholder: ${objectPath}`);
        } catch (err) {
            console.error(`Failed creating ${objectPath}:`, err.message || err);
        }
    }

    console.log("Done.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
