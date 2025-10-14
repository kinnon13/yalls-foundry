import { SEOHelmet } from '@/lib/seo/helmet';
import { DevNav } from '@/components/DevNav';

export default function Search() {
  return (
    <>
      <SEOHelmet title="Search" description="Search events and businesses" />
      <DevNav />
      <main className="min-h-screen p-4">
        <h1 className="text-3xl font-bold mb-4">Search</h1>
        <p className="text-muted-foreground">Search functionality ready for implementation</p>
      </main>
    </>
  );
}