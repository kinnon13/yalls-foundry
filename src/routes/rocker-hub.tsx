/**
 * Rocker Hub
 * Central command for interacting with Rocker
 */

import { RockerVaultUpload } from '@/components/rocker/RockerVaultUpload';
import { RockerSessionStart } from '@/components/rocker/RockerSessionStart';
import { DailyKickoff } from '@/components/rocker/DailyKickoff';
import { PhoneSetup } from '@/components/rocker/PhoneSetup';
import { OutboxTrigger } from '@/components/rocker/OutboxTrigger';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Shield, Zap } from 'lucide-react';

export default function RockerHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
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

        {/* Footer Info */}
        <Card className="p-6 bg-muted">
          <h3 className="font-bold mb-3">How Rocker Works</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">1. Permanent Memory</h4>
              <p className="text-muted-foreground">
                Everything you tell Rocker is stored, embedded, and indexed. He never forgets.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">2. Evidence Cards</h4>
              <p className="text-muted-foreground">
                Every action shows inputs → steps → outputs with undo links when applicable.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">3. Ask Questions</h4>
              <p className="text-muted-foreground">
                Rocker asks clarifying questions before acting. You're always in control.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}