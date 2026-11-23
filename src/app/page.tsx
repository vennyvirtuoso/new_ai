import { fetchAllNews } from "@/lib/feeds";
import { NewsDashboard } from "@/components/NewsDashboard";

export const revalidate = 900; // Refresh every 15 minutes via Vercel ISR

export default async function HomePage() {
  const initialData = await fetchAllNews();
  return <NewsDashboard initialData={initialData} />;
}
