import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, User, ShoppingCart } from 'lucide-react';
import { useSession } from '@/lib/auth/context';
import { TourButton } from '@/components/rocker/TourButton';
import { useCartCount } from '@/hooks/useCartCount';
import { useAuthMergeCart } from '@/hooks/useAuthMergeCart';
import { PreviewDropdown } from '@/components/layout/PreviewDropdown';
import GlobalNav from '@/components/nav/GlobalNav';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { Badge } from '@/design/components/Badge';
import { tokens } from '@/design/tokens';
import { FinderModal } from '@/components/finder/FinderModal';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface GlobalHeaderProps {
  showRockerLabels?: boolean;
}

export function GlobalHeader({ showRockerLabels: propShowRockerLabels }: GlobalHeaderProps = {}) {
  const navigate = useNavigate();
  const { session, signOut } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRockerLabels] = useState(propShowRockerLabels ?? false);
  const [finderOpen, setFinderOpen] = useState(false);
  const { data: cartCount = 0 } = useCartCount();
  
  useAuthMergeCart();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: tokens.zIndex.header,
      width: '100%',
      background: tokens.color.bg.dark,
      borderBottom: `1px solid ${tokens.color.text.secondary}40`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        padding: `0 ${tokens.space.m}px`,
        maxWidth: 1440,
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.l }}>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.space.xs,
            fontWeight: tokens.typography.weight.bold,
            fontSize: tokens.typography.size.l,
            textDecoration: 'none',
            color: tokens.color.text.primary,
          }}>
            yalls.ai
          </Link>
          
          <nav style={{ display: 'flex', alignItems: 'center', gap: tokens.space.s }}>
            <GlobalNav />
          </nav>
        </div>

        <form onSubmit={handleSearch} style={{ flex: '1', maxWidth: 400, margin: `0 ${tokens.space.m}px` }}>
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.s }}>
          <Button
            variant="ghost"
            size="m"
            onClick={() => setFinderOpen(true)}
          >
            <Search size={16} />
          </Button>
          
          {session && <NotificationBell />}
          
          <TourButton />
          <PreviewDropdown />
          
          <Button
            variant="ghost"
            size="m"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('modal', 'cart');
              setSearchParams(params);
            }}
          >
            <ShoppingCart size={16} />
            {cartCount > 0 && <Badge variant="danger">{cartCount}</Badge>}
          </Button>

          {session ? (
            <>
              <Link to={`/profile/${session.userId}`}>
                <Button variant="ghost" size="m">
                  <User size={16} style={{ marginRight: tokens.space.xxs }} />
                  Profile
                </Button>
              </Link>
              <Button variant="secondary" size="m" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="m">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button variant="primary" size="m">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      
      <FinderModal open={finderOpen} onClose={() => setFinderOpen(false)} />
    </header>
  );
}
