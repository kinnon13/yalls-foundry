import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

// Map routes to user-friendly page names
const ROUTE_NAMES: Record<string, string> = {
  '/': 'Home Page (main feed)',
  '/search': 'Search Page',
  '/login': 'Login Page',
  '/signup': 'Sign Up Page',
  '/consent': 'Consent Management',
  '/ai-management': 'AI Management (Rocker settings)',
  '/marketplace': 'Marketplace (browse listings)',
  '/cart': 'Shopping Cart',
  '/checkout': 'Checkout',
  '/dashboard': 'User Dashboard',
  '/profile': 'User Profile',
  '/horses': 'Horses Directory',
  '/horses/create': 'Create Horse Profile',
  '/events': 'Events Calendar',
  '/events/create': 'Create Event',
  '/posts/saved': 'Saved Posts',
  '/calendar': 'Personal Calendar',
  '/entities/unclaimed': 'Unclaimed Entities',
  '/mlm/dashboard': 'MLM Dashboard',
  '/mlm/tree': 'MLM Network Tree',
  '/rocker-debug': 'Rocker Debug Panel',
  '/admin/control-room': 'Admin Control Room'
};

function getPageName(route?: string): string {
  if (!route) return 'Unknown Page';
  
  // Exact match
  if (ROUTE_NAMES[route]) return ROUTE_NAMES[route];
  
  // Pattern matching for dynamic routes
  if (route.startsWith('/marketplace/')) return 'Marketplace Listing Detail';
  if (route.startsWith('/profile/')) return 'User Profile Page';
  if (route.startsWith('/horses/') && !route.includes('/create')) return 'Horse Profile Page';
  if (route.startsWith('/events/') && !route.includes('/create')) return 'Event Detail Page';
  if (route.startsWith('/business/')) {
    if (route.includes('/settings/profile')) return 'Business Profile Settings';
    if (route.includes('/settings/payments')) return 'Business Payment Settings';
    if (route.includes('/crm/contacts')) return 'Business CRM Contacts';
    if (route.includes('/crm/leads')) return 'Business CRM Leads';
    if (route.includes('/hub')) return 'Business Hub';
    return 'Business Page';
  }
  
  return `Page: ${route}`;
}

export async function buildUserContext(
  supabaseClient: SupabaseClient,
  userId: string,
  userEmail?: string,
  currentRoute?: string,
  actorRole?: 'user' | 'admin' | 'knower'
): Promise<string> {
  let context = `\n\n**CURRENT USER:**\n- User ID: ${userId}\n- Email: ${userEmail || 'Not provided'}`;
  
  if (currentRoute) {
    const pageName = getPageName(currentRoute);
    context += `\n- Current page: ${pageName}`;
    if (pageName.includes('Page:')) {
      context += ` (route: ${currentRoute})`;
    }
  }
  
  if (actorRole) {
    context += `\n- AI Role: ${actorRole}`;
    if (actorRole === 'knower') {
      context += ' (Super Admin - Full Knowledge Access)';
    } else if (actorRole === 'admin') {
      context += ' (Admin - User + Admin Knowledge)';
    }
  }

  try {
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name, bio')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles = (userRoles || []).map((r: any) => r.role);
    
    if (roles.length > 0) {
      context += `\n- Roles: ${roles.join(', ')}`;
    }

    const { data: memoryData } = await supabaseClient.functions.invoke('rocker-memory', {
      body: {
        action: 'search_memory',
        limit: 25
      }
    });

    const { data: analytics } = await supabaseClient
      .from('ai_user_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false })
      .limit(5);

    if (profile) {
      context += `\n- Name: ${profile.display_name || 'Not set'}`;
      if (profile.bio) {
        context += `\n- Bio: ${profile.bio}`;
      }
    }

    if (memoryData?.memories?.length > 0) {
      context += `\n\n**USER MEMORY:**\n${memoryData.memories.slice(0, 10).map((m: any) => 
        `- ${m.key}: ${JSON.stringify(m.value)}`
      ).join('\n')}`;
    }

    if (analytics && analytics.length > 0) {
      context += `\n\n**USER ANALYTICS:**\n${analytics.slice(0, 3).map((a: any) => 
        `- ${a.metric_type}: ${a.metric_value}`
      ).join('\n')}`;
    }
  } catch (err: any) {
    context += `\n\n[Context loading error: ${err.message}]`;
  }

  return context;
}
