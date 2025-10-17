import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function DashboardBreadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getBreadcrumbLabel = (segment: string): string => {
    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      business: 'Business',
      producers: 'Producers',
      incentives: 'Incentives',
      stallions: 'Stallions',
      'farm-ops': 'Farm Operations',
      events: 'Events',
      orders: 'Orders',
      earnings: 'Earnings',
      approvals: 'Approvals',
      settings: 'Settings',
    };
    return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">
        <Home size={16} />
      </Link>
      
      {pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        const isLast = index === pathSegments.length - 1;

        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight size={16} />
            {isLast ? (
              <span className="text-foreground font-medium">{getBreadcrumbLabel(segment)}</span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">
                {getBreadcrumbLabel(segment)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
