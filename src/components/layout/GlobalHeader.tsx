import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Calendar, Home, Building2, Zap } from 'lucide-react';
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

interface GlobalHeaderProps {
  showRockerLabels?: boolean;
}

export function GlobalHeader({ showRockerLabels: propShowRockerLabels }: GlobalHeaderProps = {}) {
  const navigate = useNavigate();
  const { session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'horses' | 'businesses' | 'events' | 'users'>('all');
  const [showRockerLabels, setShowRockerLabels] = useState(propShowRockerLabels ?? false);

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
              <Badge className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                "home nav"
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
                  <Badge className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                    "dashboard nav"
                  </Badge>
                )}
              </div>
            )}
            <div className="relative">
              <Link to="/horses">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-rocker="horses nav"
                  aria-label="Horses navigation"
                  className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                >
                  Horses
                </Button>
              </Link>
              {showRockerLabels && (
                <Badge className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                  "horses nav"
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
                <Badge className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                  "marketplace nav"
                </Badge>
              )}
            </div>
            <div className="relative">
              <Link to="/events">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-rocker="events nav"
                  aria-label="Events navigation"
                  className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Events
                </Button>
              </Link>
              {showRockerLabels && (
                <Badge className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                  "events nav"
                </Badge>
              )}
            </div>
            <div className="relative">
              <Link to="/entities/unclaimed">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  data-rocker="claim nav" 
                  aria-label="Claim navigation"
                  className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Claim
                </Button>
              </Link>
              {showRockerLabels && (
                <Badge className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                  "claim nav"
                </Badge>
              )}
            </div>
            {session && (
              <>
                <div className="relative">
                  <Link to="/calendar">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      data-rocker="calendar nav" 
                      aria-label="Calendar navigation"
                      className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Calendar
                    </Button>
                  </Link>
                  {showRockerLabels && (
                    <Badge className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                      "calendar nav"
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Link to={`/business/${session.userId}/hub`}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      data-rocker="business nav"
                      aria-label="Business navigation"
                      className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Business
                    </Button>
                  </Link>
                  {showRockerLabels && (
                    <Badge className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs pointer-events-none z-10">
                      "business nav"
                    </Badge>
                  )}
                </div>
              </>
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
                className="pr-8"
                data-rocker="search input"
                aria-label="Search input"
              />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </form>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          <TourButton />
          {session ? (
            <>
              <Link to="/profile">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  data-rocker="profile nav" 
                  aria-label="Profile navigation"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  variant="outline" 
                  size="sm" 
                  data-rocker="sign out" 
                  aria-label="Sign out"
                >
                  Sign Out
                </Button>
              </Link>
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
              <Link to="/signup">
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
