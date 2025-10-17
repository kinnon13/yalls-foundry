import { LinkedAccount, LinkedAccountsPort, SocialProvider } from '@/ports/linkedAccounts';

const KEY = 'mock:linked_accounts';

function read(): Record<string, LinkedAccount[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(db: Record<string, LinkedAccount[]>) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export const linkedAccountsMock: LinkedAccountsPort = {
  async list(userId) {
    const db = read();
    return db[userId] || [];
  },

  async upsert(userId, provider, handle, proof_url) {
    const db = read();
    const accounts = db[userId] || [];
    const existing = accounts.find(a => a.provider === provider);

    if (existing) {
      existing.handle = handle;
      existing.proof_url = proof_url;
      existing.verified = false;
    } else {
      const newAccount: LinkedAccount = {
        id: crypto.randomUUID(),
        user_id: userId,
        provider,
        handle,
        proof_url,
        verified: false,
        linked_at: new Date().toISOString(),
      };
      accounts.push(newAccount);
    }

    db[userId] = accounts;
    write(db);
    
    return accounts.find(a => a.provider === provider)!;
  },

  async remove(userId, accountId) {
    const db = read();
    db[userId] = (db[userId] || []).filter(a => a.id !== accountId);
    write(db);
  },
};
