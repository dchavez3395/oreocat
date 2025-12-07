"use client";

import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type UploadResult = {
  path: string;
  signedUrl?: string;
  bucket: string;
};

type StoredFile = {
  path: string;
  signedUrl?: string;
  bucket: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [uploaded, setUploaded] = useState<UploadResult | null>(null);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [filesStatus, setFilesStatus] = useState<"idle" | "loading" | "error">("idle");
  const [filesMessage, setFilesMessage] = useState("");
  const { data: session, status: authStatus } = useSession();
  const isAuthed = !!session?.user?.id;

  async function loadFiles() {
    if (!isAuthed) {
      setFiles([]);
      setFilesStatus("idle");
      return;
    }
    setFilesStatus("loading");
    setFilesMessage("");
    try {
      const res = await fetch("/api/files");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch files.");
      }
      setFiles(json.files || []);
      setFilesStatus("idle");
    } catch (error) {
      setFilesStatus("error");
      const msg = error instanceof Error ? error.message : "Failed to fetch files.";
      setFilesMessage(msg);
    }
  }

  useEffect(() => {
    loadFiles();
  }, [isAuthed]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthed) {
      setStatus("error");
      setMessage("Sign in to upload files.");
      return;
    }
    if (!file) {
      setStatus("error");
      setMessage("Pick a file first.");
      return;
    }

    setStatus("uploading");
    setMessage("Uploading to Supabase Storage...");
    setUploaded(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Upload failed.");
      }

      setUploaded(json);
      setStatus("done");
      setMessage("Upload complete.");
    } catch (error) {
      setStatus("error");
      const msg = error instanceof Error ? error.message : "Upload failed.";
      setMessage(msg);
    } finally {
      loadFiles();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-900">
      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white shadow-md">
              O
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-indigo-700">Oreocat</p>
              <h1 className="text-2xl font-semibold text-slate-900">Supabase upload starter for Next.js</h1>
            </div>
          </div>
          <p className="max-w-3xl text-base text-slate-600">
            Drop a file and we will send it through a Next.js API route into Supabase Storage.
            Set your Supabase keys in <code className="rounded bg-slate-900/5 px-1 py-0.5">.env.local</code>,
            then run <code className="rounded bg-slate-900/5 px-1 py-0.5">npm run dev</code>. Sign in to keep uploads private.
          </p>
        </header>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
          <div className="text-sm text-slate-700">
            {authStatus === "loading"
              ? "Checking session..."
              : isAuthed
                ? `Signed in as ${session?.user?.email || session?.user?.name || session?.user?.id}`
                : "You are not signed in."}
          </div>
          <div className="flex items-center gap-3">
            {isAuthed ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              >
                Sign out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signIn("github")}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>

        {!isAuthed ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-900/5">
            <p className="text-base font-semibold text-slate-800">Sign in to manage your private library</p>
            <p className="mt-2 text-sm text-slate-500">
              Uploads are stored under your user folder in the private bucket. Use the GitHub button above to continue.
            </p>
          </section>
        ) : (
          <section className="grid gap-6 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-900/5 lg:grid-cols-[1.2fr_1fr]">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label
              htmlFor="file"
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-700">
                <span className="text-xl font-semibold">↑</span>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">Choose an image or document</p>
                <p className="text-sm text-slate-500">PNG, JPG, PDF, etc. Max size depends on your bucket policy.</p>
              </div>
              <input
                id="file"
                name="file"
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setFile(selected);
                  setMessage("");
                  setStatus("idle");
                }}
              />
              {file && (
                <p className="text-sm text-indigo-700">
                  Ready to upload: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </label>

            <button
              type="submit"
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={status === "uploading"}
            >
              {status === "uploading" ? "Uploading..." : "Upload to Supabase"}
            </button>
            <p
              className={`text-sm ${
                status === "error" ? "text-rose-600" : status === "done" ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {message || "We will return a signed URL so you can render it below."}
            </p>
          </form>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-6">
            <p className="text-sm font-semibold text-slate-800">Latest upload</p>
            {uploaded?.signedUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <Image
                    src={uploaded.signedUrl}
                    alt="Uploaded file preview"
                    width={800}
                    height={600}
                    className="h-64 w-full object-cover"
                  />
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>
                    Bucket: <span className="font-semibold text-slate-800">{uploaded.bucket}</span>
                  </p>
                  <p className="break-all">
                    Path: <span className="font-mono text-xs text-slate-700">{uploaded.path}</span>
                  </p>
                  <a
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800"
                    href={uploaded.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View signed URL ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-start justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                <p>No file uploaded yet.</p>
                <p>Add your Supabase keys, sign in, then upload to see the preview.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Recent uploads (private bucket, signed URLs)</p>
              <button
                type="button"
                onClick={loadFiles}
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                disabled={filesStatus === "loading"}
              >
                {filesStatus === "loading" ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {filesStatus === "error" ? (
              <p className="text-sm text-rose-600">{filesMessage || "Failed to load files."}</p>
            ) : files.length === 0 ? (
              <p className="text-sm text-slate-500">No uploads yet.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {files.map((file) => (
                  <li
                    key={file.path}
                    className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3"
                  >
                    {file.signedUrl ? (
                      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                        <Image
                          src={file.signedUrl}
                          alt={file.path}
                          width={800}
                          height={600}
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                        No preview available
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-700 break-all">{file.path}</div>
                      {file.signedUrl ? (
                        <a
                          href={file.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                        >
                          Open signed URL
                        </a>
                      ) : (
                        <p className="text-sm text-slate-500">No signed URL available.</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        )}

        <section className="grid gap-3 rounded-2xl bg-slate-900 px-6 py-6 text-slate-100 shadow-xl ring-1 ring-slate-900/10 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-indigo-200">Config</p>
            <ul className="space-y-1 text-sm text-slate-200">
              <li>1. Create a Supabase project and a storage bucket (public or private).</li>
              <li>2. Add keys to <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">.env.local</code>.</li>
              <li>3. Run <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">npm run dev</code> and upload.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-indigo-200">Notes</p>
            <ul className="space-y-1 text-sm text-slate-200">
              <li>API route uses the service role key to upload server-side.</li>
              <li>Adjust bucket name with <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">SUPABASE_STORAGE_BUCKET</code>.</li>
              <li>Remote image domains are whitelisted in <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">next.config.ts</code>.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

