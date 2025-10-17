/**
 * Rocker Rodeo Integration
 * Enables Rocker to assist with event entries, draws, results
 */

import { supabase } from '@/integrations/supabase/client';
import { submitEntry, getEventClasses, getClassEntries, getClassDraw, getClassResults } from '@/lib/rodeo/service';

export async function rockerEnterEvent(eventId: string, classId: string, userId: string, horseId?: string) {
  const entryId = await submitEntry(classId, userId, horseId);
  return { success: true, entryId };
}

export async function rockerCheckMyEntries(eventId: string, userId: string) {
  const classes = await getEventClasses(eventId);
  const allEntries = await Promise.all(
    classes.map(async (c: any) => {
      const entries = await getClassEntries(c.id);
      return entries.filter((e: any) => e.rider_user_id === userId);
    })
  );
  return allEntries.flat();
}

export async function rockerCheckMyDraw(eventId: string, userId: string) {
  const classes = await getEventClasses(eventId);
  const allDraws = await Promise.all(
    classes.map(async (c: any) => {
      const draws = await getClassDraw(c.id);
      return draws.filter((d: any) => d.entry?.rider_user_id === userId);
    })
  );
  return allDraws.flat();
}

export async function rockerCheckMyResults(eventId: string, userId: string) {
  const classes = await getEventClasses(eventId);
  const allResults = await Promise.all(
    classes.map(async (c: any) => {
      const results = await getClassResults(c.id);
      return results.filter((r: any) => r.entry?.rider_user_id === userId);
    })
  );
  return allResults.flat();
}
