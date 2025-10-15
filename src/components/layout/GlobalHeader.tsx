import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Calendar, Home, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/lib/auth/context';

export function GlobalHeader() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'horses' | 'businesses' | 'events' | 'users'>('all');

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
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            yalls.ai
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link to="/horses">
              <Button variant="ghost" size="sm">Horses</Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="ghost" size="sm">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Marketplace
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="ghost" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </Button>
            </Link>
            {session && (
              <Link to={`/business/${session.userId}/hub`}>
                <Button variant="ghost" size="sm">
                  <Building2 className="h-4 w-4 mr-2" />
                  Business
                </Button>
              </Link>
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
              />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </form>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="sm">Sign Out</Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
