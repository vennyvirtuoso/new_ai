import { fetchAllNews } from "@/lib/feeds";
import { getSiteUrl } from "@/lib/site";
import { NewsDashboard } from "@/components/NewsDashboard";

export const revalidate = 900; // Refresh every 15 minutes via Vercel ISR

export default async function HomePage() {
  const initialData = await fetchAllNews();
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Frontier Brief",
    url: siteUrl,
    description:
      "Curated real-time worldwide news for AI/ML researchers across frontier papers, major labs, quantum physics, adjacent tech, and entrepreneurship.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewsDashboard initialData={initialData} />
    </>
  );
}
