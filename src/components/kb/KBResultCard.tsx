import { FileText, Calendar, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { KnowledgeItem } from '@/lib/ai/rocker/kb';

interface KBResultCardProps {
  item: KnowledgeItem;
  onClick: () => void;
  isSelected: boolean;
}

export function KBResultCard({ item, onClick, isSelected }: KBResultCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title & URI */}
            <div>
              <h3 className="font-semibold text-base leading-tight mb-1">
                {item.title}
              </h3>
              <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {item.uri}
              </code>
            </div>

            {/* Summary */}
            {item.summary && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.summary}
              </p>
            )}

            {/* Metadata Row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant={item.scope === 'global' ? 'default' : 'secondary'} className="text-xs">
                {item.scope}
              </Badge>
              
              <span className="flex items-center gap-1">
                {item.category}
                {item.subcategory && ` / ${item.subcategory}`}
              </span>

              {item.updated_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.tags.length - 5}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
