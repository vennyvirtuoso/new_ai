import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchAllNews } from "@/lib/feeds";
import { DOMAINS, DOMAIN_MAP } from "@/lib/sources";
import { getSiteUrl } from "@/lib/site";
import type { DomainId } from "@/lib/types";
import { NewsDashboard } from "@/components/NewsDashboard";

export const revalidate = 900;

export function generateStaticParams() {
  return DOMAINS.map((domain) => ({ slug: domain.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const domain = DOMAIN_MAP[slug as DomainId];
  if (!domain) return {};

  const siteUrl = getSiteUrl();
  const ogUrl = `${siteUrl}/api/og?title=${encodeURIComponent(
    `${domain.label} — Latest Worldwide Briefing`
  )}&domain=${encodeURIComponent(domain.id)}&source=${encodeURIComponent(
    "Frontier Brief"
  )}`;

  return {
    title: `${domain.label} News & Research — Frontier Brief`,
    description: domain.description,
    alternates: {
      canonical: `${siteUrl}/domain/${domain.id}`,
    },
    openGraph: {
      title: `${domain.label} — Frontier Brief`,
      description: domain.description,
      url: `${siteUrl}/domain/${domain.id}`,
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: domain.label }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${domain.label} — Frontier Brief`,
      description: domain.description,
      images: [ogUrl],
    },
  };
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const domain = DOMAIN_MAP[slug as DomainId];
  if (!domain) notFound();

  const initialData = await fetchAllNews();
  const domainArticles = initialData.articles
    .filter((a) => a.domain === domain.id)
    .slice(0, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${domain.label} — Frontier Brief`,
    description: domain.description,
    url: `${getSiteUrl()}/domain/${domain.id}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: domainArticles.map((art, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: art.url,
        name: art.title,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewsDashboard initialData={initialData} initialDomain={domain.id} />
    </>
  );
}
