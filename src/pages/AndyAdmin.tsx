import { AndyAdminPanel } from '@/components/AndyAdminPanel';

export default function AndyAdmin() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Andy Admin</h1>
          <p className="text-muted-foreground">
            Control panel for Andy's learning and memory systems
          </p>
        </div>
        <AndyAdminPanel />
      </div>
    </div>
  );
}
