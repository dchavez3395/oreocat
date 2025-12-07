import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "public-images";
    const prefix = `users/${userId}/uploads`;

    const { data: list, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 20,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const paths = (list || []).filter((item) => item.name).map((item) => `${prefix}/${item.name}`);

    if (!paths.length) {
      return NextResponse.json({ files: [] });
    }

    const { data: signedUrls, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, 60 * 60); // 1 hour

    if (signedError || !signedUrls) {
      return NextResponse.json(
        { error: signedError?.message || "Failed to generate signed URLs." },
        { status: 500 },
      );
    }

    const files = signedUrls.map((item) => ({
      path: item.path,
      signedUrl: item.signedUrl,
      bucket,
    }));

    return NextResponse.json({ files });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
