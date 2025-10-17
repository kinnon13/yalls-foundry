import { supabase } from '@/integrations/supabase/client';

export type NavItem = {
  key: string;
  label: string;
  path: string;
  icon?: string | null;
  badgeCount?: number;
};

export async function getHeaderNav(userId?: string | null): Promise<NavItem[]> {
  // Try DB-driven capabilities first
  const { data: rows } = await supabase
    .from('features')
    .select(`
      key, label, path, icon, is_public,
      feature_locations!inner(location, sort_order),
      account_capabilities(user_id, enabled)
    `)
    .eq('feature_locations.location', 'header')
    .order('feature_locations.sort_order', { ascending: true });

  // Filter by capability (public OR enabled for user)
  const enabled = (rows ?? []).filter((r: any) =>
    r.is_public || (userId && r.account_capabilities?.some((a: any) => a.user_id === userId && a.enabled))
  );

  // Fallback (if capability rows not wired yet)
  const fallback: NavItem[] = [
    { key: 'feed', label: 'Feed', path: '/feed', icon: 'MessageSquare' },
    { key: 'messages', label: 'Messages', path: '/messages', icon: 'Mail' },
    { key: 'crm', label: 'CRM', path: '/crm', icon: 'Users' },
  ];

  const base: NavItem[] = enabled.length ? enabled.map((r: any) => ({
    key: r.key, label: r.label, path: r.path, icon: r.icon ?? null
  })) : fallback;

  // Attach badges (counts)
  const [dmCount, taskCount] = await Promise.all([
    getUnreadDMCount(userId),
    getOpenTaskCount(userId),
  ]);

  return base.map(item => {
    if (item.key === 'messages') return { ...item, badgeCount: dmCount };
    if (item.key === 'crm') return { ...item, badgeCount: taskCount };
    return item;
  });
}

export async function getDashboardNav(userId?: string | null): Promise<NavItem[]> {
  const { data: rows } = await supabase
    .from('features')
    .select(`
      key, label, path, icon, is_public,
      feature_locations!inner(location, sort_order),
      account_capabilities(user_id, enabled)
    `)
    .eq('feature_locations.location', 'dashboard')
    .order('feature_locations.sort_order', { ascending: true });

  const enabled = (rows ?? []).filter((r: any) =>
    r.is_public || (userId && r.account_capabilities?.some((a: any) => a.user_id === userId && a.enabled))
  );

  return enabled.map((r: any) => ({
    key: r.key, label: r.label, path: r.path, icon: r.icon ?? null
  }));
}

async function getUnreadDMCount(userId?: string | null): Promise<number> {
  if (!userId) return 0;
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_user_id', userId)
    .is('read_at', null);
  return count ?? 0;
}

async function getOpenTaskCount(userId?: string | null): Promise<number> {
  if (!userId) return 0;
  const { count } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', userId)
    .eq('status', 'open');
  return count ?? 0;
}
