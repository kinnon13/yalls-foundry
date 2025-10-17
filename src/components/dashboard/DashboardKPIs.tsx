import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  ShoppingCart,
  Users
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface KPIData {
  gmv_7d: number;
  gmv_28d: number;
  capture_rate: number;
  missed_cents: number;
  approvals_pending: number;
  campaigns_scheduled: number;
  atc_rate: number;
  rsvp_rate: number;
}

interface DashboardKPIsProps {
  kpis: KPIData | null;
  isLoading: boolean;
}

interface KPITile {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  variant: 'primary' | 'success' | 'warning' | 'danger';
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

export function DashboardKPIs({ kpis, isLoading }: DashboardKPIsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  const tiles: KPITile[] = [
    {
      label: 'GMV (7 days)',
      value: formatCurrency(kpis.gmv_7d),
      icon: <TrendingUp size={24} />,
      variant: 'primary',
    },
    {
      label: 'GMV (28 days)',
      value: formatCurrency(kpis.gmv_28d),
      icon: <TrendingUp size={24} />,
      variant: 'primary',
    },
    {
      label: 'Capture Rate',
      value: `${kpis.capture_rate}%`,
      icon: <Target size={24} />,
      variant: kpis.capture_rate > 10 ? 'success' : 'warning',
    },
    {
      label: 'Missed Revenue',
      value: formatCurrency(kpis.missed_cents),
      icon: <AlertTriangle size={24} />,
      variant: kpis.missed_cents > 0 ? 'danger' : 'success',
    },
    {
      label: 'Pending Approvals',
      value: kpis.approvals_pending,
      icon: <CheckCircle size={24} />,
      variant: kpis.approvals_pending > 0 ? 'warning' : 'success',
    },
    {
      label: 'Campaigns Scheduled',
      value: kpis.campaigns_scheduled,
      icon: <Calendar size={24} />,
      variant: 'primary',
    },
    {
      label: 'Add-to-Cart Rate',
      value: `${kpis.atc_rate}%`,
      icon: <ShoppingCart size={24} />,
      variant: kpis.atc_rate > 5 ? 'success' : 'warning',
    },
    {
      label: 'RSVP Rate',
      value: `${kpis.rsvp_rate}%`,
      icon: <Users size={24} />,
      variant: kpis.rsvp_rate > 50 ? 'success' : 'warning',
    },
  ];

  const getVariantClass = (variant: KPITile['variant']) => {
    switch (variant) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'danger':
        return 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300';
      default:
        return 'bg-primary/10 border-primary/20 text-primary';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Key Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile, index) => (
          <div
            key={index}
            className={`
              p-6 rounded-lg border backdrop-blur-sm
              transition-all duration-200 hover:scale-105
              ${getVariantClass(tile.variant)}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-background/50">
                {tile.icon}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium opacity-80">{tile.label}</p>
              <p className="text-2xl font-bold">{tile.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
