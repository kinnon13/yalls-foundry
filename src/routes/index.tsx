import { Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { DevNav } from '@/components/DevNav';
import { useSession } from '@/lib/auth/context';

export default function Index() {
  const { session } = useSession();

  return (
    <>
      <SEOHelmet title="Home" description="yalls.ai - Connecting communities" />
      <DevNav />
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full mb-6">
          <div className="flex items-center justify-between rounded-md border p-3">
            {session ? (
              <div className="text-sm">
                Signed in as <span className="font-medium">{session.email}</span> ({session.role})
              </div>
            ) : (
              <div className="text-sm">
                You're not signed in. <Link className="underline" to="/login">Sign in</Link>
              </div>
            )}
            <Link className="text-sm underline" to="/admin/control-room">Control Room</Link>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">Welcome to yalls.ai</h1>
        <p className="text-muted-foreground">Day-0 Foundation Pack - Ready for production</p>
      </main>
    </>
  );
}