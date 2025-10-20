/**
 * Evidence Card
 * Shows "show your work" for every Rocker action
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Link2, 
  Undo2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface EvidenceCardProps {
  title: string;
  inputs?: Record<string, any>;
  steps?: Array<{ label: string; result: string }>;
  outputs?: Record<string, any>;
  uncertainties?: string[];
  vaultChanges?: { added?: string[]; modified?: string[]; deleted?: string[] };
  undoAvailable?: boolean;
  onUndo?: () => void;
}

export function EvidenceCard({
  title,
  inputs = {},
  steps = [],
  outputs = {},
  uncertainties = [],
  vaultChanges,
  undoAvailable = false,
  onUndo
}: EvidenceCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="border-l-4 border-l-primary">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">{title}</h3>
              </div>
              
              {uncertainties.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">
                    {uncertainties.length} question{uncertainties.length > 1 ? 's' : ''} for you
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {undoAvailable && onUndo && (
                <Button variant="ghost" size="sm" onClick={onUndo}>
                  <Undo2 className="h-4 w-4" />
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent className="space-y-4 mt-4">
            {Object.keys(inputs).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Inputs
                </h4>
                <div className="bg-muted p-3 rounded text-sm space-y-1">
                  {Object.entries(inputs).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {steps.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Steps Taken
                </h4>
                <ol className="space-y-2">
                  {steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">
                        {idx + 1}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{step.label}</p>
                        {step.result && (
                          <p className="text-xs text-muted-foreground">{step.result}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {Object.keys(outputs).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Results
                </h4>
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded text-sm space-y-1">
                  {Object.entries(outputs).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uncertainties.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  Questions / Uncertainties
                </h4>
                <ul className="space-y-2">
                  {uncertainties.map((question, idx) => (
                    <li key={idx} className="text-sm bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {vaultChanges && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Vault Changes
                </h4>
                <div className="space-y-2 text-sm">
                  {vaultChanges.added && vaultChanges.added.length > 0 && (
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Added {vaultChanges.added.length}
                      </Badge>
                      <span className="text-muted-foreground">
                        {vaultChanges.added.join(', ')}
                      </span>
                    </div>
                  )}
                  {vaultChanges.modified && vaultChanges.modified.length > 0 && (
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Modified {vaultChanges.modified.length}
                      </Badge>
                      <span className="text-muted-foreground">
                        {vaultChanges.modified.join(', ')}
                      </span>
                    </div>
                  )}
                  {vaultChanges.deleted && vaultChanges.deleted.length > 0 && (
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Removed {vaultChanges.deleted.length}
                      </Badge>
                      <span className="text-muted-foreground">
                        {vaultChanges.deleted.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </Card>
  );
}