import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TreeNode {
  name: string;
  children?: Record<string, TreeNode | string[]>;
}

interface KBTreeViewProps {
  scope: 'global' | 'site' | 'user';
  onSelect: (category: string, subcategory?: string) => void;
  selectedCategory: string;
  selectedSubcategory: string;
}

// Knowledge base structure
const KB_TREE: Record<string, TreeNode> = {
  'Entities & Data': {
    name: 'Entities & Data',
    children: {
      'Profiles': {
        name: 'Profiles',
        children: {
          'Business': ['subcategories', 'types'],
          'Horse': ['subcategories', 'fields'],
          'Rider': ['types'],
          'Owner': ['types'],
          'Breeder': ['types'],
          'Farm/Stable': ['types'],
          'Trainer': ['types'],
          'Veterinarian': ['types'],
          'Event Organizer': ['types']
        }
      },
      'Inventory & Products': {
        name: 'Inventory & Products',
        children: {
          'Listings': ['types'],
          'Categories': ['taxonomy']
        }
      },
      'Events': {
        name: 'Events',
        children: {
          'Creation': ['workflows'],
          'Registration': ['workflows'],
          'Results': ['import', 'display']
        }
      }
    }
  },
  'Marketplace': {
    name: 'Marketplace',
    children: {
      'Taxonomy': {
        name: 'Taxonomy',
        children: {
          'Animals': ['horses', 'disciplines'],
          'Semen/Embryos': ['types'],
          'Stud & Breeding': ['services'],
          'Services': ['types'],
          'Tack & Equipment': ['categories'],
          'Apparel': ['categories'],
          'Feed & Supplements': ['categories'],
          'Trailers': ['types'],
          'Property': ['types'],
          'Events & Tickets': ['types'],
          'Digital Goods': ['types'],
          'Advertising': ['types']
        }
      }
    }
  },
  'Analytics': {
    name: 'Analytics',
    children: {
      'KPI': {
        name: 'KPI',
        children: {
          'Business': ['commerce', 'services', 'breeding', 'events'],
          'Users': ['creator', 'buyer', 'trust'],
          'Animals': ['performance', 'breeding', 'health']
        }
      }
    }
  },
  'Workflows': {
    name: 'Workflows',
    children: {
      'Breeding': {
        name: 'Breeding',
        children: {
          'Create Stud Listing': ['playbook'],
          'Book Breeding': ['playbook']
        }
      },
      'Events': {
        name: 'Events',
        children: {
          'Import Results': ['playbook'],
          'Create Event': ['playbook']
        }
      },
      'Verification': {
        name: 'Verification',
        children: {
          'Verify EIN': ['playbook'],
          'Verify Registration': ['playbook']
        }
      }
    }
  }
};

function TreeItem({ 
  name, 
  node, 
  level, 
  path,
  onSelect,
  selectedPath
}: { 
  name: string; 
  node: TreeNode | string[];
  level: number;
  path: string[];
  onSelect: (path: string[]) => void;
  selectedPath: string[];
}) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = !Array.isArray(node) && node.children;
  const isSelected = path.join('/') === selectedPath.join('/');

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else {
      onSelect(path);
    }
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start gap-2 h-8 px-2 hover:bg-accent",
          isSelected && "bg-accent text-accent-foreground font-medium"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          expanded ? 
            <ChevronDown className="h-4 w-4 shrink-0" /> : 
            <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        {!hasChildren && <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />}
        {hasChildren && <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <span className="truncate text-sm">{name}</span>
      </Button>

      {hasChildren && expanded && (
        <div>
          {Object.entries((node as TreeNode).children || {}).map(([childName, childNode]) => (
            <TreeItem
              key={childName}
              name={childName}
              node={childNode}
              level={level + 1}
              path={[...path, childName]}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function KBTreeView({ scope, onSelect, selectedCategory, selectedSubcategory }: KBTreeViewProps) {
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  const handleSelect = (path: string[]) => {
    setSelectedPath(path);
    if (path.length >= 2) {
      const category = path[0];
      const subcategory = path.slice(1).join('/');
      onSelect(category, subcategory);
    } else if (path.length === 1) {
      onSelect(path[0]);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
          {scope} Knowledge
        </div>
        {Object.entries(KB_TREE).map(([name, node]) => (
          <TreeItem
            key={name}
            name={name}
            node={node}
            level={0}
            path={[name]}
            onSelect={handleSelect}
            selectedPath={selectedPath}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
