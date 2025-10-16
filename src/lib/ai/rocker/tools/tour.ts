/**
 * Tour Navigation Tool
 * 
 * Allows Rocker to navigate users through the platform
 */

import { platformTour, getTourStop, formatTourStop } from '../tour';

export const tourNavigationTool = {
  name: 'navigate_tour',
  description: 'Navigate to a specific page in the platform tour and provide contextual information',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to navigate to',
        enum: platformTour.map(stop => stop.path)
      }
    },
    required: ['path']
  }
};

export async function executeTourNavigation(
  path: string,
  navigate: (path: string) => void
): Promise<string> {
  const stop = getTourStop(path);
  
  if (!stop) {
    return 'Sorry, I could not find that tour stop. Available locations: ' + 
           platformTour.map(s => s.title).join(', ');
  }

  // Navigate to the page
  navigate(path);

  // Return formatted tour information
  return formatTourStop(stop);
}

export function getFullTourDescription(): string {
  return `
I can give you a guided tour of the platform! Here are the areas I can show you:

${platformTour.map((stop, i) => `${i + 1}. **${stop.title}** (${stop.path}) - ${stop.description}`).join('\n\n')}

Just say "show me around" or "take me to [area name]" and I'll guide you through each section with detailed explanations of what you can do there!
  `.trim();
}
