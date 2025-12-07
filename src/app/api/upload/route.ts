import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "public-images";
    const filePath = `uploads/${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const arrayBuffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return NextResponse.json({
      path: data.path,
      publicUrl: urlData.publicUrl,
      bucket,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
