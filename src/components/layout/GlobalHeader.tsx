import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, User, ShoppingBag, Calendar, Home, Building2, Zap, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/lib/auth/context';
import { TourButton } from '@/components/rocker/TourButton';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';
import { useCartCount } from '@/hooks/useCartCount';
import { PreviewDropdown } from '@/components/layout/PreviewDropdown';

interface GlobalHeaderProps {
  showRockerLabels?: boolean;
}

export function GlobalHeader({ showRockerLabels: propShowRockerLabels }: GlobalHeaderProps = {}) {
  const navigate = useNavigate();
  const { session } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'horses' | 'businesses' | 'events' | 'users'>('all');
  const [showRockerLabels, setShowRockerLabels] = useState(propShowRockerLabels ?? false);
  const { data: cartCount = 0 } = useCartCount();

  // Listen to localStorage changes for label state
  useEffect(() => {
    if (propShowRockerLabels !== undefined) {
      setShowRockerLabels(propShowRockerLabels);
    } else {
      const checkLabels = () => {
        const labels = localStorage.getItem('show-rocker-labels') === 'true';
        setShowRockerLabels(labels);
      };
      checkLabels();
      const interval = setInterval(checkLabels, 500);
      return () => clearInterval(interval);
    }
  }, [propShowRockerLabels]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&category=${searchCategory}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            className="flex items-center gap-2 font-bold text-lg"
            data-rocker="home-logo"
            aria-label="Go to homepage"
          >
            yalls.ai
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <div className="relative">
              <Link to="/">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-rocker="home nav"
                  aria-label="Home navigation"
                  className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              {showRockerLabels && (
                <Badge className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                  "home nav"
                </Badge>
              )}
            </div>
            
            <div className="relative">
              <Link to="/search">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-rocker="search nav"
                  aria-label="Search navigation"
                  className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </Link>
              {showRockerLabels && (
                <Badge className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                  "search nav"
                </Badge>
              )}
            </div>
            
            <div className="relative">
              <Link to="/marketplace">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-rocker="marketplace nav"
                  aria-label="Marketplace navigation"
                  className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Marketplace
                </Button>
              </Link>
              {showRockerLabels && (
                <Badge className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                  "marketplace nav"
                </Badge>
              )}
            </div>
            
            {session && (
              <div className="relative">
                <Link to="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    data-rocker="dashboard nav"
                    aria-label="Dashboard navigation"
                    className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                  >
                    Dashboard
                  </Button>
                </Link>
                {showRockerLabels && (
                  <Badge className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                    "dashboard nav"
                  </Badge>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="flex w-full gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-24">
                  {searchCategory === 'all' ? 'All' : searchCategory.charAt(0).toUpperCase() + searchCategory.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-background z-50">
                <DropdownMenuItem onClick={() => setSearchCategory('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchCategory('horses')}>Horses</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchCategory('businesses')}>Businesses</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchCategory('events')}>Events</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchCategory('users')}>Users</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Search horses, businesses, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pr-8 ${showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}`}
                data-rocker="search input"
                aria-label="Search input"
              />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {showRockerLabels && (
                <Badge className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                  "search input"
                </Badge>
              )}
            </div>
          </div>
        </form>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          <TourButton />
          
          {/* Preview Dropdown (dev/staging only) */}
          <PreviewDropdown />
          
          {/* Cart Icon */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('modal', 'cart');
                setSearchParams(params);
              }}
              data-rocker="cart nav"
              aria-label="Shopping cart"
              className={`relative ${showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}`}
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
            {showRockerLabels && (
              <Badge className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                "cart nav"
              </Badge>
            )}
          </div>

          {session ? (
            <>
              <div className="relative">
                <Link to={`/profile/${session.userId}`}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    data-rocker="profile nav" 
                    aria-label="Profile navigation"
                    className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                {showRockerLabels && (
                  <Badge className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                    "profile nav"
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    data-rocker="sign out" 
                    aria-label="Sign out"
                    className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                  >
                    Sign Out
                  </Button>
                </Link>
                {showRockerLabels && (
                  <Badge className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                    "sign out"
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-rocker="sign in nav"
                  aria-label="Sign in navigation"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  size="sm"
                  data-rocker="sign up nav"
                  aria-label="Sign up navigation"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
