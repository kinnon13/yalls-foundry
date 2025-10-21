import { Calendar as CalendarIcon } from 'lucide-react';

export function Calendar() {
  return (
    <div className="h-full p-8">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendar</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage your schedule and events</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/50 p-8">
          <div className="text-center space-y-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 flex items-center justify-center mx-auto">
              <CalendarIcon className="h-10 w-10 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Calendar Integration Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Connect your Google Calendar, Outlook, or other calendar services to manage your schedule directly from Super Rocker.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
