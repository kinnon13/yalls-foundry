import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PREVIEW_ITEMS, getPreviewGroups } from '@/preview/registry';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { FlaskConical } from 'lucide-react';

const enabled = import.meta.env.VITE_PREVIEW_ENABLED === 'true';

export function PreviewDropdown() {
  const groups = useMemo(() => getPreviewGroups(), []);
  if (!enabled) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" aria-label="Open preview menu">
          <FlaskConical className="h-4 w-4" />
          Preview
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 bg-background border shadow-lg z-[100]">
        <DropdownMenuLabel>Preview Screens</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {groups.map(group => (
          <div key={group}>
            <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">{group}</div>
            {PREVIEW_ITEMS.filter(i => i.group === group).map(i => (
              <DropdownMenuItem key={i.id} asChild>
                <Link to={i.path} className="w-full">
                  <div className="flex flex-col">
                    <span>{i.label}</span>
                    {i.desc && <span className="text-[11px] text-muted-foreground">{i.desc}</span>}
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
        <DropdownMenuItem asChild>
          <Link to="/preview" className="w-full">Open Index</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
