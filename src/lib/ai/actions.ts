export async function invokeAction(action: { app: string; type: string; payload?: any }) {
  // stub action broker – log and return OK
  return { ok: true, received: action };
}
