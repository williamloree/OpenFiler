import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <nav className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">OpenFiler</span>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#4f8ff7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3a7be0]"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
        <div className="inline-block rounded-full bg-[#4f8ff7]/10 px-4 py-1.5 text-sm font-medium text-[#4f8ff7] mb-6">
          Open Source &middot; Self-Hosted &middot; Gratuit
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
          Gérez vos fichiers<br />
          <span className="text-[#4f8ff7]">simplement</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-secondary mb-10 leading-relaxed">
          OpenFiler est une plateforme open-source de gestion de fichiers.
          Uploadez, organisez, prévisualisez et partagez vos images, vidéos et
          documents depuis une interface moderne et sécurisée.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="rounded-lg bg-[#4f8ff7] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a7be0] shadow-lg shadow-[#4f8ff7]/25"
          >
            Commencer gratuitement
          </Link>
          <a
            href="https://github.com/williamloree/OpenFiler"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-8 py-3.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Voir sur GitHub
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold mb-4">
          Tout ce qu&apos;il faut pour gérer vos fichiers
        </h2>
        <p className="text-center text-secondary mb-14 max-w-xl mx-auto">
          Une interface complète inspirée des meilleurs outils de stockage cloud,
          déployable sur votre propre serveur.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="&#128228;"
            title="Upload drag & drop"
            description="Glissez-déposez vos fichiers ou sélectionnez-les. Support des images, vidéos et documents jusqu'à 64 MB."
          />
          <FeatureCard
            icon="&#128065;&#65039;"
            title="Prévisualisation"
            description="Prévisualisez vos images, vidéos et PDF directement dans le navigateur sans téléchargement."
          />
          <FeatureCard
            icon="&#128274;"
            title="Fichiers privés"
            description="Contrôlez la visibilité de chaque fichier. Les fichiers privés sont protégés par authentification."
          />
          <FeatureCard
            icon="&#128194;"
            title="Organisation par type"
            description="Vos fichiers sont automatiquement classés en images, vidéos et documents avec compteurs et statistiques."
          />
          <FeatureCard
            icon="&#128269;"
            title="Recherche et tri"
            description="Recherchez par nom, triez par taille, date ou type. Sélection par lot pour les opérations en masse."
          />
          <FeatureCard
            icon="&#128272;"
            title="Authentification sécurisée"
            description="Système d'authentification moderne avec Better Auth. Sessions sécurisées, aucun mot de passe en clair."
          />
        </div>
      </section>

      {/* FILE TYPES */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold mb-14">
            Formats supportés
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <FileTypeCard
              icon="&#128247;"
              title="Images"
              types="JPEG, PNG, SVG, WebP, BMP, ICO"
              limit="6 par upload"
              color="#2563eb"
              bg="#dbeafe"
            />
            <FileTypeCard
              icon="&#127909;"
              title="Vidéos"
              types="MP4, AVI, MOV, WMV, FLV, WebM, MKV"
              limit="2 par upload"
              color="#db2777"
              bg="#fce7f3"
            />
            <FileTypeCard
              icon="&#128196;"
              title="Documents"
              types="PDF, DOCX"
              limit="3 par upload"
              color="#d97706"
              bg="#fef3c7"
            />
          </div>
          <p className="text-center text-sm text-secondary mt-8">
            Taille maximale par fichier : <strong>64 MB</strong>
          </p>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold mb-14">
          Stack technique moderne
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TechBadge name="Next.js 15" detail="App Router" />
          <TechBadge name="TypeScript" detail="Typage strict" />
          <TechBadge name="Tailwind CSS" detail="v4" />
          <TechBadge name="Better Auth" detail="Sessions sécurisées" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0f1724] text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à gérer vos fichiers ?
          </h2>
          <p className="text-[#94a3b8] mb-8 max-w-lg mx-auto">
            Déployez OpenFiler sur votre serveur en quelques minutes.
            Open-source, gratuit, sans limites artificielles.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="rounded-lg bg-[#4f8ff7] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a7be0]"
            >
              Créer un compte
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-white/20 px-8 py-3.5 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-sm text-secondary">
          <span>OpenFiler &mdash; Open Source File Manager</span>
          <a
            href="https://github.com/williamloree/OpenFiler"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 transition-shadow hover:shadow-md">
      <div className="text-2xl mb-3" dangerouslySetInnerHTML={{ __html: icon }} />
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <p className="text-sm text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function FileTypeCard({
  icon,
  title,
  types,
  limit,
  color,
  bg,
}: {
  icon: string;
  title: string;
  types: string;
  limit: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="text-center">
      <div
        className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4"
        style={{ backgroundColor: bg, color }}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-secondary mb-1">{types}</p>
      <p className="text-xs text-secondary">{limit}</p>
    </div>
  );
}

function TechBadge({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-white px-5 py-4 text-center">
      <div className="font-semibold text-sm">{name}</div>
      <div className="text-xs text-secondary mt-0.5">{detail}</div>
    </div>
  );
}
