import { useEntitlements } from '@/hooks/use-entitlements';
import { PaywallOverlay } from '@/components/paywall/Overlay';

interface ModuleGuardProps {
  moduleKey: string;
  children: React.ReactNode;
}

/**
 * ModuleGuard - Wraps dashboard modules and features with entitlement checks
 * 
 * Usage:
 *   <ModuleGuard moduleKey="business">
 *     <BusinessPanel />
 *   </ModuleGuard>
 */
export function ModuleGuard({ moduleKey, children }: ModuleGuardProps) {
  const { canUseModule } = useEntitlements();
  
  if (!canUseModule(moduleKey)) {
    return <PaywallOverlay moduleKey={moduleKey} />;
  }
  
  return <>{children}</>;
}
