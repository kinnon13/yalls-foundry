import { useLinkedAccounts } from '@/hooks/useLinkedAccounts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Twitter, Instagram, Facebook, Youtube, Music } from 'lucide-react';
import { VerifyAccountModal } from './VerifyAccountModal';
import { useState } from 'react';
import { SocialProvider } from '@/ports/linkedAccounts';

interface LinkedAccountsProps {
  userId: string;
  isOwner?: boolean;
}

const providerConfig = {
  twitter: { icon: Twitter, label: 'Twitter', color: 'text-blue-400' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'text-blue-600' },
  youtube: { icon: Youtube, label: 'YouTube', color: 'text-red-600' },
  tiktok: { icon: Music, label: 'TikTok', color: 'text-foreground' },
};

export function LinkedAccounts({ userId, isOwner = false }: LinkedAccountsProps) {
  const { data: accounts = [], isLoading, remove } = useLinkedAccounts(userId);
  const [showAddModal, setShowAddModal] = useState(false);

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-muted rounded-lg" />;
  }

  if (accounts.length === 0 && !isOwner) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Connected Accounts</h3>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Link Account
          </Button>
        )}
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No connected accounts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => {
            const config = providerConfig[account.provider];
            const Icon = config.icon;

            return (
              <Card key={account.id} className="relative group">
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className={`h-6 w-6 ${config.color}`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">@{account.handle}</p>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                  </div>
                  {account.verified && (
                    <Badge variant="secondary" className="shrink-0">
                      Verified
                    </Badge>
                  )}
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => remove.mutate(account.id)}
                      aria-label={`Unlink ${config.label} account`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isOwner && (
        <VerifyAccountModal open={showAddModal} onOpenChange={setShowAddModal} userId={userId} />
      )}
    </div>
  );
}
