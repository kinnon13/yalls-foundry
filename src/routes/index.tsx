import { SEOHelmet } from '@/lib/seo/helmet';
import { DevNav } from '@/components/DevNav';

export default function Index() {
  return (
    <>
      <SEOHelmet title="Home" description="yalls.ai - Connecting communities" />
      <DevNav />
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">Welcome to yalls.ai</h1>
        <p className="text-muted-foreground">Day-0 Foundation Pack - Ready for production</p>
      </main>
    </>
  );
}