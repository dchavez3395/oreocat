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
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-6">
          <nav className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Image src="/images/catlogo.jpg" alt="Oreocat logo" width={160} height={48} className="h-12 w-auto" />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Private Library
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                className="hidden sm:block w-64 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-indigo-400 focus:outline-none"
                placeholder="Search your library (UI only)"
                type="search"
              />
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
                  onClick={() => signIn("google")}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          </nav>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 shadow-xl">
            <div className="flex flex-col gap-6 px-8 py-10 sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4 text-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-100 ring-1 ring-white/15">
                  Secure uploads
                </div>
                <div>
                  <p className="text-lg text-indigo-100">Oreocat Library</p>
                  <h1 className="text-3xl font-semibold sm:text-4xl">Private uploads, your way.</h1>
                </div>
                <p className="max-w-2xl text-base text-indigo-100/80">
                  Sign in to save files to your own space. We keep objects private and hand you time-limited signed URLs
                  so you control access.
                </p>
                <div className="flex flex-wrap gap-3">
                  {isAuthed ? (
                    <button
                      type="button"
                      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-indigo-100"
                    >
                      Ready to upload
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => signIn("google")}
                      className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400"
                    >
                      Sign in to start
                    </button>
                  )}
                  <a
                    href="#library"
                    className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
                  >
                    View library
                  </a>
                </div>
              </div>
              <div className="mt-6 h-48 w-full max-w-md rounded-xl bg-gradient-to-br from-indigo-500/40 via-cyan-400/30 to-white/10 p-[1px] shadow-lg">
                <div className="flex h-full flex-col justify-between rounded-[14px] bg-slate-900/70 p-4 text-indigo-100 ring-1 ring-white/10">
                  <div className="text-sm font-semibold text-indigo-100">Signed URL preview</div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 text-xs">
                    <div className="space-y-1">
                      <p className="text-indigo-100">Users/{isAuthed ? session?.user?.id : "your-id"}/uploads</p>
                      <p className="text-indigo-200/80">Expires in 1 hour</p>
                    </div>
                    <div className="rounded-full bg-indigo-500/80 px-3 py-1 text-[11px] font-semibold text-white">
                      Private
                    </div>
                  </div>
                  <p className="text-xs text-indigo-100/80">
                    Storage stays private; we generate signed links so only you (or who you share with) can view.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {!isAuthed ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-900/5">
            <p className="text-base font-semibold text-slate-800">Sign in to manage your private library</p>
            <p className="mt-2 text-sm text-slate-500">
              Uploads are stored under your user folder in the private bucket. Use the GitHub button above to continue.
            </p>
          </section>
        ) : (
          <section
            id="library"
            className="grid gap-6 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-900/5 lg:grid-cols-[1.2fr_1fr]"
          >
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

