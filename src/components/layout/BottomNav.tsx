import { Home, Compass, PlusSquare, Heart, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Compass, label: 'Discover', path: '/discover' },
    { icon: PlusSquare, label: 'Create', path: '/create' },
    { icon: Heart, label: 'Activity', path: '/activity' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/95 backdrop-blur-xl border-t border-border/40 z-50">
      <div className="flex items-center justify-around h-full max-w-screen-xl mx-auto px-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 px-5 py-2.5",
                "transition-all duration-300 ease-out group",
                "hover:scale-105 active:scale-95"
              )}
            >
              {/* Active indicator background */}
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-2xl scale-110 animate-in fade-in duration-200" />
              )}
              
              {/* Icon container */}
              <div className={cn(
                "relative rounded-xl p-2 transition-all duration-300",
                isActive 
                  ? "bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg shadow-primary/20" 
                  : "group-hover:bg-accent/50"
              )}>
                <Icon 
                  className={cn(
                    "h-6 w-6 transition-all duration-300",
                    isActive 
                      ? "text-primary drop-shadow-sm" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-[10px] font-semibold tracking-wide transition-all duration-300",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {item.label}
              </span>
              
              {/* Active dot indicator */}
              {isActive && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary animate-in zoom-in duration-200" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
