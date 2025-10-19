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
import { Checkbox } from '@/components/ui/checkbox';
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
  Plus,
  X,
  GitCompare,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { useProfilePins } from '@/hooks/useProfilePins';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const { 
    activeProfile, 
    setActiveProfile, 
    userProfiles, 
    setUserProfiles,
    comparisonMode,
    setComparisonMode,
    comparisonProfiles,
    toggleComparisonProfile,
  } = useProfile();
  const [user, setUser] = useState<any>(null);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const { data: pins, add, remove } = useProfilePins(user?.id || null);

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
    if (comparisonMode) {
      toggleComparisonProfile(profile);
    } else {
      setActiveProfile(profile);
      toast({
        title: 'Profile switched',
        description: `Now viewing ${profile.name}`,
      });
    }
  };

  const handleStartComparison = () => {
    const businesses = userProfiles.filter((p) => p.type === 'business');
    if (businesses.length < 2) {
      toast({
        title: 'Not enough businesses',
        description: 'You need at least 2 businesses to compare',
        variant: 'destructive',
      });
      return;
    }
    setComparisonMode(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Filter to show only pinned apps for active profile
  const profilePins = activeProfile
    ? pins.filter((p) => p.pin_type === 'app' && p.ref_id === activeProfile.id)
    : [];
  
  const pinnedAppIds = new Set(profilePins.map((p) => p.metadata?.appId));
  const visibleApps = backendApps.filter((app) => pinnedAppIds.has(app.id));
  const unpinnedApps = backendApps.filter((app) => !pinnedAppIds.has(app.id));

  const handlePinApp = (appId: string) => {
    if (!activeProfile) return;
    add.mutate({
      pin_type: 'app',
      ref_id: activeProfile.id,
      metadata: { appId },
    });
  };

  const handleUnpinApp = (appId: string) => {
    if (!activeProfile) return;
    const pinToRemove = profilePins.find((p) => p.metadata?.appId === appId);
    if (pinToRemove) {
      remove.mutate({
        pin_type: pinToRemove.pin_type,
        ref_id: pinToRemove.ref_id,
      });
    }
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
                {comparisonMode ? 'Select Profiles' : 'Switch Profile'}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                {comparisonMode && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Select profiles to compare
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                {userProfiles.map((profile) => (
                  <DropdownMenuItem
                    key={profile.id}
                    onClick={() => handleProfileSwitch(profile)}
                    className="flex items-center gap-3 p-3"
                  >
                    {comparisonMode && (
                      <Checkbox
                        checked={comparisonProfiles.some((p) => p.id === profile.id)}
                      />
                    )}
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
                    {!comparisonMode && activeProfile?.id === profile.id && (
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

        {/* Comparison Mode Toggle */}
        {userProfiles.filter((p) => p.type === 'business').length >= 2 && (
          <>
            <DropdownMenuItem onClick={handleStartComparison}>
              <GitCompare className="mr-2 h-4 w-4" />
              Compare Businesses
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Backend Apps */}
        <div className="flex items-center justify-between px-4 py-1.5">
          <DropdownMenuLabel className="text-xs text-muted-foreground p-0">
            Backend Apps
          </DropdownMenuLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowAppPicker(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-1 p-2">
          {visibleApps.map((app) => {
            const Icon = app.icon;
            return (
              <div key={app.id} className="relative group">
                <DropdownMenuItem
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnpinApp(app.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
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

      {/* App Picker Dialog */}
      <Dialog open={showAppPicker} onOpenChange={setShowAppPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Backend App</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="grid grid-cols-2 gap-2">
              {unpinnedApps.map((app) => {
                const Icon = app.icon;
                return (
                  <Button
                    key={app.id}
                    variant="outline"
                    className="h-20 flex flex-col gap-2 items-center justify-center"
                    onClick={() => {
                      handlePinApp(app.id);
                      setShowAppPicker(false);
                      toast({
                        title: 'App pinned',
                        description: `${app.label} added to ${activeProfile?.name}`,
                      });
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium text-center">{app.label}</span>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
