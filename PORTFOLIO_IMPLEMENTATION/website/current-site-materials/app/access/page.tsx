import type { Metadata } from "next";
import { AccessForm } from "./access-form";

export const metadata: Metadata = {
  title: "Private preview | Shani Nakash-Gomel",
  robots: { index: false, follow: false },
};

type AccessPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="access-shell">
      <section className="access-card" aria-labelledby="access-title">
        <div className="access-mark" aria-hidden="true">
          SN
        </div>
        <p className="eyebrow">Private preview</p>
        <h1 id="access-title">This portfolio is currently under review.</h1>
        <p className="access-copy">
          Enter the shared password to continue to Shani&apos;s portfolio.
        </p>
        <AccessForm nextPath={safeNext} />
      </section>
    </main>
  );
}
