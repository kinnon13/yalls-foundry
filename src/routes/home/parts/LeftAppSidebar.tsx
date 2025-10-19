import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, Settings, DollarSign, Trophy, ShoppingCart,
  Building, Users, Sparkles, CheckCircle, TrendingUp,
  MessageSquare, User, MapPin, Flame, BookOpen, 
  Store, Activity, Zap, Target, Award, LucideIcon,
  Package, Truck, RotateCcw, CreditCard, Receipt,
  Tag, BarChart3, Megaphone, Link2, Video, FolderOpen,
  Globe, FileText, HardDrive, ClipboardList, Grid3x3
} from 'lucide-react';

interface AppConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  route?: string;
  color?: string;
}

// Organized app sections
const appSections = {
  commerce: [
    { key: 'orders', label: 'Orders', icon: ShoppingCart, route: '/orders', color: 'text-blue-500' },
    { key: 'inventory', label: 'Inventory', icon: Package, route: '/inventory', color: 'text-purple-500' },
    { key: 'listings', label: 'Listings', icon: Store, route: '/listings', color: 'text-orange-500' },
    { key: 'shipping', label: 'Shipping', icon: Truck, route: '/shipping', color: 'text-green-500' },
    { key: 'returns', label: 'Returns', icon: RotateCcw, route: '/returns', color: 'text-red-500' },
  ],
  money: [
    { key: 'earnings', label: 'Earnings', icon: DollarSign, route: '/earnings', color: 'text-emerald-500' },
    { key: 'payouts', label: 'Payouts', icon: CreditCard, route: '/payouts', color: 'text-teal-500' },
    { key: 'taxes', label: 'Taxes', icon: Receipt, route: '/taxes', color: 'text-amber-500' },
    { key: 'coupons', label: 'Promos', icon: Tag, route: '/coupons', color: 'text-pink-500' },
  ],
  ops: [
    { key: 'messages', label: 'Messages', icon: MessageSquare, route: '/messages', color: 'text-blue-400' },
    { key: 'contacts', label: 'Contacts', icon: Users, route: '/contacts', color: 'text-violet-500' },
    { key: 'calendar', label: 'Calendar', icon: Calendar, route: '/calendar', color: 'text-red-400' },
    { key: 'tasks', label: 'Tasks', icon: ClipboardList, route: '/tasks', color: 'text-indigo-500' },
  ],
  growth: [
    { key: 'ads', label: 'Ads', icon: Megaphone, route: '/ads', color: 'text-fuchsia-500' },
    { key: 'affiliates', label: 'Affiliates', icon: Link2, route: '/affiliates', color: 'text-cyan-500' },
    { key: 'analytics', label: 'Analytics', icon: BarChart3, route: '/analytics', color: 'text-slate-500' },
  ],
  creator: [
    { key: 'studio', label: 'Studio', icon: Video, route: '/studio', color: 'text-rose-500' },
    { key: 'media', label: 'Media', icon: FolderOpen, route: '/media', color: 'text-yellow-500' },
  ],
  system: [
    { key: 'settings', label: 'Settings', icon: Settings, route: '/settings', color: 'text-gray-500' },
    { key: 'profile', label: 'Profile', icon: User, route: '/profile', color: 'text-blue-600' },
  ],
};

interface LeftAppSidebarProps {
  onAppClick: (app: AppConfig) => void;
}

export default function LeftAppSidebar({ onAppClick }: LeftAppSidebarProps) {
  const { data: entities = [] } = useQuery({
    queryKey: ['my-entities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('entities')
        .select('id, display_name, kind, metadata')
        .eq('owner_user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('display_name');
      return data || [];
    }
  });

  const handleClick = (app: AppConfig) => {
    onAppClick(app);
  };

  const handleEntityClick = (entity: any) => {
    onAppClick({
      key: `entity-${entity.id}`,
      label: entity.display_name,
      route: `/entity/${entity.id}`,
      icon: Building,
      color: 'text-primary'
    });
  };

  const renderAppTile = (app: AppConfig) => (
    <button
      key={app.key}
      onClick={() => handleClick(app)}
      className="group flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-muted/50 transition-all duration-200"
    >
      <div className={`
        w-14 h-14 rounded-2xl flex items-center justify-center 
        bg-gradient-to-br from-background to-muted
        border shadow-md group-hover:scale-110 group-hover:shadow-xl
        transition-all duration-200
        ${app.color || 'text-foreground'}
      `}>
        <app.icon className="w-7 h-7" />
      </div>
      <span className="text-[10px] text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors">
        {app.label}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-muted/30 to-muted/10 backdrop-blur-xl border-r overflow-y-auto">
      {/* Header - Big Y'alls.Ai branding */}
      <div className="p-6 border-b border-border/50">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent mb-4">
          Y'alls.Ai
        </h1>
        <input
          type="search"
          placeholder="Search apps..."
          className="w-full px-3 py-2 text-sm bg-background/50 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* Y'all App Library - Featured at top */}
        <section>
          <button
            onClick={() => onAppClick({ 
              key: 'yall-library', 
              label: 'Y\'all App Library', 
              icon: Grid3x3,
              route: '/apps',
              color: 'text-primary'
            })}
            className="w-full group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Grid3x3 className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Y'all App Library</div>
              <div className="text-xs text-muted-foreground">Discover & manage apps</div>
            </div>
          </button>
        </section>
        {/* My Entities */}
        {entities.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2">MY ENTITIES</h3>
            <div className="grid grid-cols-3 gap-2">
              {entities.slice(0, 9).map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => handleEntityClick(entity)}
                  className="group flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-muted/50 transition-all duration-200"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl transition-all duration-200">
                    <span className="text-sm font-bold text-primary">
                      {entity.display_name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] text-center leading-tight line-clamp-2 text-muted-foreground group-hover:text-foreground transition-colors">
                    {entity.display_name}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Commerce */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2">COMMERCE</h3>
          <div className="grid grid-cols-3 gap-2">
            {appSections.commerce.map(renderAppTile)}
          </div>
        </section>

        {/* Money */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2">MONEY</h3>
          <div className="grid grid-cols-3 gap-2">
            {appSections.money.map(renderAppTile)}
          </div>
        </section>

        {/* Ops & Comms */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2">OPS & COMMS</h3>
          <div className="grid grid-cols-3 gap-2">
            {appSections.ops.map(renderAppTile)}
          </div>
        </section>

        {/* Growth */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2">GROWTH</h3>
          <div className="grid grid-cols-3 gap-2">
            {appSections.growth.map(renderAppTile)}
          </div>
        </section>

        {/* Creator */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2">CREATOR</h3>
          <div className="grid grid-cols-2 gap-2">
            {appSections.creator.map(renderAppTile)}
          </div>
        </section>

        {/* System */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2">SYSTEM</h3>
          <div className="grid grid-cols-2 gap-2">
            {appSections.system.map(renderAppTile)}
          </div>
        </section>
      </div>
    </div>
  );
}
