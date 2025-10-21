/**
 * Capability Manifest - Read-only surfacing of system capabilities
 * Used by Gemini auditor and admin interfaces
 */

export const CAPABILITIES = [
  {
    id: "site.ingest",
    category: "admin",
    enabled: true,
    describe: "Index public website content into vector knowledge base",
    fn: "rocker-crawl-site",
    rbac: "super_admin"
  },
  {
    id: "repo.ingest",
    category: "admin",
    enabled: true,
    describe: "Index source repository files into knowledge base",
    fn: "rocker-ingest-repo",
    rbac: "super_admin"
  },
  {
    id: "kb.search",
    category: "query",
    enabled: true,
    describe: "Vector similarity search over knowledge base",
    fn: "kb-search",
    rbac: "authenticated"
  },
  {
    id: "audit.pr",
    category: "security",
    enabled: true,
    describe: "Gemini second auditor for PR review",
    fn: "rocker-audit",
    rbac: "super_admin"
  },
  {
    id: "ai.chat",
    category: "ai",
    enabled: true,
    describe: "Chat with AI assistant using unified gateway",
    fn: "rocker-chat",
    rbac: "authenticated"
  },
  {
    id: "ai.embed",
    category: "ai",
    enabled: true,
    describe: "Generate embeddings via unified gateway",
    fn: "generate-embeddings",
    rbac: "service"
  }
] as const;

export type CapabilityId = typeof CAPABILITIES[number]['id'];
export type CapabilityCategory = typeof CAPABILITIES[number]['category'];

/**
 * Get capability by ID
 */
export function getCapability(id: CapabilityId) {
  return CAPABILITIES.find(c => c.id === id);
}

/**
 * Get capabilities by category
 */
export function getCapabilitiesByCategory(category: CapabilityCategory) {
  return CAPABILITIES.filter(c => c.category === category);
}

/**
 * Check if capability is enabled
 */
export function isCapabilityEnabled(id: CapabilityId): boolean {
  return getCapability(id)?.enabled ?? false;
}
