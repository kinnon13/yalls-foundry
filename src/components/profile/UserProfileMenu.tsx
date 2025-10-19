import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Building2,
  LogOut,
  Settings,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Network,
  BarChart3,
  FileText,
  Calendar,
  Package,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';

/**
 * User Profile Menu - Shows all backend apps + profile switcher
 * Apps are context-aware (filter by active entity)
 */

interface BackendApp {
  id: string;
  label: string;
  icon: any;
  route: string;
  badge?: number;
  description: string;
}

export function UserProfileMenu() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, setActiveProfile, userProfiles, setUserProfiles } = useProfile();
  const [user, setUser] = useState<any>(null);

  // Backend apps available to all profiles
  const backendApps: BackendApp[] = [
    {
      id: 'earnings',
      label: 'Earnings',
      icon: DollarSign,
      route: '/earnings',
      description: 'Commission history & payouts',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      route: '/dashboard?tab=analytics',
      description: 'Performance metrics',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      route: '/orders',
      description: 'Sales & purchases',
    },
    {
      id: 'crm',
      label: 'CRM',
      icon: Users,
      route: '/crm',
      description: 'Contact management',
    },
    {
      id: 'mlm-tree',
      label: 'MLM Network',
      icon: Network,
      route: '/mlm',
      description: 'Downline & referrals',
    },
    {
      id: 'listings',
      label: 'Listings',
      icon: Package,
      route: '/listings',
      description: 'Products & inventory',
    },
    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      route: '/events',
      description: 'Competitions & shows',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      route: '/dashboard?tab=reports',
      description: 'Export & insights',
    },
  ];

  // Load user session + owned profiles
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfiles(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfiles(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfiles = async (userId: string) => {
    // Load user's own profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('user_id', userId)
      .single();

    // Load owned entities (businesses, farms, etc.)
    const { data: entities } = await supabase
      .from('entities')
      .select('id, kind, display_name')
      .eq('owner_user_id', userId)
      .limit(10);

    const profiles = [
      {
        id: profile?.id || userId,
        type: 'user' as const,
        name: profile?.display_name || 'My Profile',
        avatarUrl: profile?.avatar_url,
      },
      ...(entities || []).map((e) => ({
        id: e.id,
        type: e.kind as any,
        name: e.display_name,
        avatarUrl: undefined, // Entities don't have avatar_url in schema
      })),
    ];

    setUserProfiles(profiles);
    if (!activeProfile && profiles.length > 0) {
      setActiveProfile(profiles[0]); // Default to user profile
    }
  };

  const handleAppClick = (app: BackendApp) => {
    navigate(app.route);
    toast({
      title: `Opening ${app.label}`,
      description: activeProfile
        ? `Filtered to ${activeProfile.name}`
        : 'Showing all data',
    });
  };

  const handleProfileSwitch = (profile: typeof userProfiles[0]) => {
    setActiveProfile(profile);
    toast({
      title: 'Profile switched',
      description: `Now viewing ${profile.name}`,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={activeProfile?.avatarUrl} alt={activeProfile?.name} />
            <AvatarFallback>
              {activeProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {activeProfile && activeProfile.type !== 'user' && (
            <Badge
              variant="secondary"
              className="absolute -bottom-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
            >
              <Building2 className="h-3 w-3" />
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80" align="end">
        {/* Active Profile */}
        <DropdownMenuLabel className="flex items-center gap-3 p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={activeProfile?.avatarUrl} />
            <AvatarFallback>
              {activeProfile?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{activeProfile?.name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {activeProfile?.type} Profile
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Profile Switcher */}
        {userProfiles.length > 1 && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Building2 className="mr-2 h-4 w-4" />
                Switch Profile
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                {userProfiles.map((profile) => (
                  <DropdownMenuItem
                    key={profile.id}
                    onClick={() => handleProfileSwitch(profile)}
                    className="flex items-center gap-3 p-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatarUrl} />
                      <AvatarFallback>
                        {profile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{profile.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {profile.type}
                      </span>
                    </div>
                    {activeProfile?.id === profile.id && (
                      <Badge variant="secondary" className="ml-auto">
                        Active
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Backend Apps */}
        <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
          Backend Apps
        </DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-1 p-2">
          {backendApps.map((app) => {
            const Icon = app.icon;
            return (
              <DropdownMenuItem
                key={app.id}
                onClick={() => handleAppClick(app)}
                className="flex flex-col items-start gap-1 p-3 h-auto cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{app.label}</span>
                  {app.badge && (
                    <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs">
                      {app.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {app.description}
                </span>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />

        {/* Settings & Logout */}
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
