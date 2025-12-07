import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "public-images";
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `users/${userId}/uploads/${randomUUID()}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, 60 * 60); // 1 hour

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: signedUrlError?.message || "Failed to generate signed URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      path: data.path,
      signedUrl: signedUrlData.signedUrl,
      bucket,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
