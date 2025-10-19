/**
 * Vault Type Definitions
 */

export type VaultItemKind = 'password' | 'note' | 'api_key' | 'doc';

export type VaultRole = 'owner' | 'admin' | 'viewer';

export interface Vault {
  id: string;
  owner_id: string;
  entity_id?: string;
  created_at: string;
}

export interface VaultItem {
  id: string;
  vault_id: string;
  kind: VaultItemKind;
  enc_blob: number[]; // bytea as number array
  meta: Record<string, any>;
  created_at: string;
}

export interface VaultAccess {
  vault_id: string;
  user_id: string;
  role: VaultRole;
  mfa_required: boolean;
}

export interface DecryptedVaultItem {
  id: string;
  kind: VaultItemKind;
  data: any;
  meta: Record<string, any>;
  created_at: string;
}
