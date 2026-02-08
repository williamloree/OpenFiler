import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-bold">OpenFiler</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary">
              {session.user.name ?? session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="mt-1 text-sm text-secondary">
            Manage your files and uploads
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border p-6">
            <h3 className="text-sm font-medium text-secondary">Total Files</h3>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <h3 className="text-sm font-medium text-secondary">Storage Used</h3>
            <p className="mt-2 text-3xl font-bold">0 MB</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <h3 className="text-sm font-medium text-secondary">
              Recent Uploads
            </h3>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border p-8 text-center">
          <p className="text-secondary">
            No files yet. Upload your first file to get started.
          </p>
          <button className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
            Upload File
          </button>
        </div>
      </main>
    </div>
  );
}
