/**
 * Capability Matrix - Central truth for role-based permissions
 * 
 * Defines what each role can do via:
 * - Bus: UI automation (open apps, type, click)
 * - API: Server-side operations (write, audit, simulate)
 */

export type Role = 'user' | 'admin' | 'super_admin' | 'agent_super_andy';

export interface RoleCapabilities {
  bus: {
    openApp: string[];  // Overlay keys this role can access
    fill: boolean;      // Can type into UI fields
    click: boolean;     // Can click UI buttons
  };
  api: {
    write: boolean;     // Can perform server-side writes
    auditRead: boolean; // Can read audit/analytics data
    simulate: boolean;  // Can run dry-run mode
  };
}

export const Capabilities: Record<Role, RoleCapabilities> = {
  user: {
    bus: { 
      openApp: [
        'yallbrary', 'marketplace', 'messages', 
        'entities', 'events', 'orders', 'cart',
        'profile', 'settings', 'favorites'
      ], 
      fill: true, 
      click: true 
    },
    api: { 
      write: true,      // Users can write (scoped by RLS)
      auditRead: false, // No audit access
      simulate: false   // No simulate needed
    },
  },
  
  admin: {
    bus: { 
      openApp: [
        'yallbrary', 'marketplace', 'entities', 
        'events', 'orders', 'analytics', 'crm',
        'activity', 'overview'
      ], 
      fill: true,  // Can type (for testing UIs)
      click: true  // Can click (for testing UIs)
    },
    api: { 
      write: false,     // Default: read-only (needs elevation)
      auditRead: true,  // Full audit access
      simulate: true    // Can dry-run writes
    },
  },
  
  super_admin: {
    bus: { 
      openApp: [
        'yallbrary', 'marketplace', 'messages', 
        'entities', 'events', 'orders', 'cart',
        'crm', 'farm-ops', 'incentives', 'analytics',
        'activity', 'overview', 'settings'
      ], 
      fill: true, 
      click: true 
    },
    api: { 
      write: true,      // Full write access
      auditRead: true,  // Full audit access
      simulate: true    // Can dry-run
    },
  },
  
  agent_super_andy: {
    bus: { 
      openApp: [
        'yallbrary', 'marketplace', 'messages', 
        'entities', 'orders', 'cart', 'events'
      ], 
      fill: true, 
      click: true 
    },
    api: { 
      write: false,     // Writes only with approval
      auditRead: true,  // Can read for context
      simulate: true    // Prefers simulate mode
    },
  },
};

/**
 * Check if a role has a specific capability
 */
export function hasCapability(
  role: Role, 
  category: 'bus' | 'api', 
  capability: string
): boolean {
  const caps = Capabilities[role];
  if (category === 'bus') {
    if (capability === 'fill') return caps.bus.fill;
    if (capability === 'click') return caps.bus.click;
    // Check if it's an app name
    return caps.bus.openApp.includes(capability);
  }
  if (category === 'api') {
    if (capability === 'write') return caps.api.write;
    if (capability === 'auditRead') return caps.api.auditRead;
    if (capability === 'simulate') return caps.api.simulate;
  }
  return false;
}

/**
 * Get list of apps a role can access
 */
export function getAllowedApps(role: Role): string[] {
  return Capabilities[role].bus.openApp;
}
