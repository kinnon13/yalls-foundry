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
            <div className="mt-6 space-y-4">
              <div className="max-h-[70vh] overflow-y-scroll overscroll-contain bg-background rounded-lg border p-6 space-y-6 text-sm">
                <section>
                  <h4 className="font-bold text-lg mb-3">Rocker Setup Guide</h4>
                  <p className="text-muted-foreground mb-4">
                    Love it. You're in — let's flip Rocker from "platform" to "partner." Here's a tight, do-this-now bring-up so Rocker can talk with you, learn from you, organize your world, and help you market/ship — with permanent super-admin memory.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-base mb-2">1) Turn Rocker "on" (flags + guardrails)</h4>
                  <p className="mb-2">Paste these SQLs (or run via your admin panel):</p>
                  <pre className="bg-muted p-3 rounded overflow-x-auto text-xs"><code>{`-- Make sure conversation + long-term memory are on
UPDATE public.runtime_flags SET value='{"enabled":true}'::jsonb WHERE key='rocker.conversation';
UPDATE public.runtime_flags SET value='{"enabled":true,"retention_days":null}'::jsonb WHERE key='rocker.memory.long_term';
-- Prefer your answers over others
UPDATE public.runtime_flags SET value='{"enabled":true,"priority":"super_admin"}'::jsonb WHERE key='rocker.memory.super_admin_priority';
-- Learning on (ranker etc.)
UPDATE public.runtime_flags SET value='{"enabled":true,"rollout":1.0}'::jsonb WHERE key='learning.enabled';
-- Safe-mode OFF so he can ask questions / explore
UPDATE public.runtime_flags SET value='{"enabled":false}'::jsonb WHERE key='global.safe_mode';`}</code></pre>
                </section>

                <section>
                  <h4 className="font-bold text-base mb-2">2) Your permanent memory (super-admin vault)</h4>
                  <p className="mb-2">Use these two "dump" paths to give Rocker everything you've got:</p>
                  <div className="space-y-3 ml-4">
                    <div>
                      <p className="font-medium">A. Quick text/links (fast):</p>
                      <p className="text-muted-foreground">In chat, send: <code className="bg-muted px-2 py-1 rounded">@rocker remember:</code> followed by notes, bullets, or links. He'll chunk, embed, tag, and file it under your SuperAdmin/ namespace.</p>
                    </div>
                    <div>
                      <p className="font-medium">B. Bulk docs (thousands of words):</p>
                      <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                        <li>ZIP or paste docs into /inbox in the app (or hit the "Upload to Vault" button)</li>
                        <li>He will: OCR/PDF → clean → split → embed (pgvector)</li>
                        <li>Create an outline + tags (project, topic, status)</li>
                        <li>Ask you about any gaps/uncertainties before filing</li>
                        <li>Produce an "Import Receipt" with what went where</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                    <p className="font-medium mb-1">Pro tips</p>
                    <ul className="list-disc pl-6 space-y-1 text-xs">
                      <li>Start each big drop with a header: <code className="bg-muted px-1 py-0.5 rounded"># Project: Rocker GTM</code> or <code className="bg-muted px-1 py-0.5 rounded"># Personal: Finances 2025</code></li>
                      <li>Use <code className="bg-muted px-1 py-0.5 rounded">@rocker pin:</code> on any message to mark as "never forget"</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h4 className="font-bold text-base mb-2">3) Real-time conversation (in-app now; voice/SMS next)</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>In the web app, open Rocker (bottom dock) → "New Session"</li>
                    <li>Say what you want, then expect Rocker to:
                      <ul className="list-circle pl-6 mt-1 space-y-1 text-muted-foreground">
                        <li>Ask clarifying questions like a world-class chief of staff</li>
                        <li>Offer a suggested plan (3 bullets, 1 first action)</li>
                        <li>Create/attach a Focus Sprint (25 min) with a micro-checklist</li>
                        <li>Log decisions + rationale into your vault</li>
                      </ul>
                    </li>
                  </ul>
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded">
                    <p className="font-medium mb-1">Voice & SMS (optional next)</p>
                    <p className="text-xs text-muted-foreground">Once your Twilio keys are set, you can text or call Rocker. (We'll wire it when you're ready — it's in your setup checklist.)</p>
                  </div>
                </section>

                <section>
                  <h4 className="font-bold text-base mb-2">4) ADHD: focus system built-in (already scheduled)</h4>
                  <p>I set a daily 9:00 AM Rocker Daily Kickoff for you. It'll remind you to review calendar + inbox, pick top 3, choose 1 focus task, and start a 25-minute sprint.</p>
                  <p className="text-sm text-muted-foreground mt-1">If you want a different time, tell me and I'll change it.</p>
                </section>

                <section>
                  <h4 className="font-bold text-base mb-2">5) "Secretary-grade" organization — what you can say today</h4>
                  <p className="mb-2">Copy/paste any of these into chat:</p>
                  <ul className="space-y-2">
                    <li className="p-2 bg-muted rounded"><code className="text-xs">"@rocker summarize and file this thread under SuperAdmin/Marketing and extract tasks with owners/due dates."</code></li>
                    <li className="p-2 bg-muted rounded"><code className="text-xs">"@rocker draft a 3-email outbound sequence to boutique creators about our marketplace beta. Tone: warm, concise. Include DM variant."</code></li>
                    <li className="p-2 bg-muted rounded"><code className="text-xs">"@rocker build a weekly GTM dashboard: signups, active creators, conversion to post, queue p95 age, exploration rate. Send me every Monday."</code></li>
                    <li className="p-2 bg-muted rounded"><code className="text-xs">"@rocker plan a 4-week launch campaign: channels, budget ranges, daily actions. Put tasks on my board and start today's sprint."</code></li>
                    <li className="p-2 bg-muted rounded"><code className="text-xs">"@rocker analyze this spreadsheet (attached), pull out anomalies, and propose fixes."</code></li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-bold text-base mb-2">6) Marketing copilot (GTM, content, outreach)</h4>
                  <p className="mb-2">Rocker will:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Maintain Audience Canon (personas, pain points, messages, proof)</li>
                    <li>Generate repeatable assets: landing copy, reels hooks, threads, carousels</li>
                    <li>Keep a Content Calendar and push you prompts daily</li>
                    <li>Track experiments with clear "win/loss/learn" notes</li>
                    <li>Manage a Lead List (CSV/Sheets) and propose prioritized outreach</li>
                    <li>Create "one-tap" task bundles (e.g., launch day workflow)</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-bold text-base mb-2">7) Finance & admin (what he can do now vs later)</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">Now (no external logins needed):</p>
                      <p className="text-muted-foreground text-sm">Budget templates, cash-runway sims, revenue targets, scenario planning, tasking follow-ups, parsing bank CSVs you upload, turning them into clean ledgers, and reminding you of bills.</p>
                    </div>
                    <div>
                      <p className="font-medium">Later (requires secure connector):</p>
                      <p className="text-muted-foreground text-sm">Read-only integrations (QuickBooks/Xero/Stripe) via OAuth. He'll ask before any action and log every step to the AI Action Ledger. (No storing of raw creds; admin-approved scopes only.)</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="font-bold text-base mb-2">8) "Show your work" always</h4>
                  <p className="mb-2">Every big action returns an Evidence Card:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Inputs → steps → outputs → links to filed notes/tasks</li>
                    <li>Any uncertainties → explicit questions back to you</li>
                    <li>What changed in your vault (diff)</li>
                    <li>Undo link when applicable</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-bold text-base mb-2">9) Admin console toggles (you)</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Rocker Asks Questions Aggressively: <span className="text-green-600 dark:text-green-400 font-medium">ON</span></li>
                    <li>Super-Admin Memory Priority: <span className="text-green-600 dark:text-green-400 font-medium">ON</span></li>
                    <li>Always Persist Super-Admin: <span className="text-green-600 dark:text-green-400 font-medium">ON</span> (no auto-expiry)</li>
                    <li>Tool Use: Web chat + doc vault (voice/SMS, email, QuickBooks connectors later)</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-bold text-base mb-2">10) Your personal starter prompt (paste this to kick off)</h4>
                  <div className="p-4 bg-primary/5 rounded border-l-4 border-primary">
                    <pre className="text-xs whitespace-pre-wrap"><code>{`Rocker, you are my chief of staff + secretary.
Goal this week: ship Rocker beta to first 100 creators and line up 10 calls.
Constraints: I have ADHD and go off-track—keep me focused.

Do this now:
1) Build today's plan from my calendar/inbox and vault.
2) Ask up to 5 clarifying questions, then propose a crisp plan (3 bullets) and the one task to start.
3) Start a 25-minute focus sprint and keep me honest with mid-sprint check-in.
4) File everything under SuperAdmin/ThisWeek and create follow-ups.`}</code></pre>
                  </div>
                </section>

                <section className="border-t pt-4">
                  <h4 className="font-bold text-base mb-2">What Loveable needs to do right now (single pass)</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Verify flags (Section #1 SQL)</li>
                    <li>Ensure memory vault and uploads are enabled (they are in your build; confirm the upload flow works)</li>
                    <li>Expose two entry points in the UI:
                      <ul className="list-disc pl-6 mt-1">
                        <li>"Upload to Vault" (accepts files/links/text; shows import receipt)</li>
                        <li>"New Rocker Session" (chat panel)</li>
                      </ul>
                    </li>
                    <li>Enable Evidence Cards on every action (include "ask if unsure")</li>
                    <li>Pin the Daily Kickoff to your sidebar (already scheduled)</li>
                    <li>(Optional) Add Twilio creds and point SMS webhook → Rocker SMS function (skippable for day-1)</li>
                  </ol>
                </section>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}