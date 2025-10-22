/**
 * UI Telemetry
 * Track overlay opens, searches, critical actions
 */

export async function sendUIEvent(name: string, detail?: any) {
  try {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, detail, timestamp: Date.now() }),
    });
  } catch (e) {
    // Silent fail
  }
}
