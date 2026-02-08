import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4">OpenFiler</h1>
        <p className="text-lg text-secondary mb-8">
          Modern open-source file management platform. Upload, organize, and
          share your files with ease.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
