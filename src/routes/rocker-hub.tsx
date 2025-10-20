/**
 * Rocker Hub
 * Central command for interacting with Rocker
 */

import { useState } from 'react';
import { RockerVaultUpload } from '@/components/rocker/RockerVaultUpload';
import { RockerSessionStart } from '@/components/rocker/RockerSessionStart';
import { DailyKickoff } from '@/components/rocker/DailyKickoff';
import { PhoneSetup } from '@/components/rocker/PhoneSetup';
import { OutboxTrigger } from '@/components/rocker/OutboxTrigger';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Shield, Zap, ChevronDown, ChevronUp, FileText } from 'lucide-react';

export default function RockerHub() {
  const [docsExpanded, setDocsExpanded] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8 pb-24">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-full">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Rocker Command Center</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your AI chief of staff. Upload knowledge, start sessions, and configure daily workflows.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              Super Admin Mode
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Permanent Memory
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <RockerSessionStart />
          </div>
        </Card>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <RockerVaultUpload />
            
            {/* Phone & Outbox */}
            <div className="grid gap-4">
              <PhoneSetup />
              <OutboxTrigger />
            </div>
          </div>
          <div className="space-y-8">
            <DailyKickoff />
            
            <Card className="p-6">
              <h3 className="font-bold mb-3">What You Can Say to Rocker</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  <span>"@rocker remember: [your note]"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  <span>"Draft a 3-email sequence to creators"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  <span>"Build a weekly GTM dashboard"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  <span>"Plan a 4-week launch campaign"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  <span>"Who should I follow up with today?"</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-blue-50 dark:bg-blue-950">
              <h3 className="font-bold mb-2">ADHD Focus System</h3>
              <p className="text-sm text-muted-foreground">
                Rocker includes 25-minute focus sprints with mid-sprint check-ins. 
                Just ask to "start a sprint" and Rocker will keep you on track.
              </p>
            </Card>
          </div>
        </div>

        {/* Setup Instructions - Expandable */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto hover:bg-transparent"
            onClick={() => setDocsExpanded(!docsExpanded)}
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Complete Setup Guide & Documentation</h3>
            </div>
            {docsExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
          
          {docsExpanded && (
            <div className="mt-6 max-h-[600px] overflow-y-auto space-y-4 text-sm prose prose-sm dark:prose-invert max-w-none">
              <div className="p-4 bg-background rounded-lg">
                <p className="text-muted-foreground italic mb-4">
                  This area displays your full Rocker setup instructions. Scroll to read everything.
                </p>
                
                <div className="space-y-6">
                  <section>
                    <h4 className="font-bold text-base mb-2">How Rocker Works</h4>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-medium mb-1">1. Permanent Memory</h5>
                        <p className="text-muted-foreground">
                          Everything you tell Rocker is stored, embedded, and indexed. He never forgets.
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">2. Evidence Cards</h5>
                        <p className="text-muted-foreground">
                          Every action shows inputs → steps → outputs with undo links when applicable.
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">3. Ask Questions</h5>
                        <p className="text-muted-foreground">
                          Rocker asks clarifying questions before acting. You're always in control.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="font-bold text-base mb-2">Getting Started</h4>
                    <p>Click "Start New Session" above to begin chatting with Rocker. You can:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Ask questions and get instant responses</li>
                      <li>Upload documents to the vault for permanent memory</li>
                      <li>Set up daily kickoff reminders</li>
                      <li>Configure phone and SMS integration</li>
                      <li>Create focus sprints for ADHD-friendly workflows</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-bold text-base mb-2">Memory System</h4>
                    <p>Rocker maintains permanent memory through:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li><strong>User Memory:</strong> Your personal preferences and context</li>
                      <li><strong>Global Knowledge:</strong> Shared patterns and insights</li>
                      <li><strong>Super Admin Priority:</strong> Your inputs take precedence</li>
                      <li><strong>Embeddings:</strong> Semantic search across all stored content</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-bold text-base mb-2">Example Commands</h4>
                    <div className="space-y-2">
                      <p><code className="px-2 py-1 bg-muted rounded">@rocker remember: [your note]</code></p>
                      <p className="text-muted-foreground text-xs">Store a permanent memory</p>
                      
                      <p><code className="px-2 py-1 bg-muted rounded">Draft a 3-email sequence</code></p>
                      <p className="text-muted-foreground text-xs">Generate marketing content</p>
                      
                      <p><code className="px-2 py-1 bg-muted rounded">Build a weekly dashboard</code></p>
                      <p className="text-muted-foreground text-xs">Create analytics and reports</p>
                      
                      <p><code className="px-2 py-1 bg-muted rounded">Plan a launch campaign</code></p>
                      <p className="text-muted-foreground text-xs">Strategic planning assistance</p>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}