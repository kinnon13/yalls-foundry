/**
 * Rocker Platform Tour System
 * 
 * Enables Rocker to guide users through the platform with contextual explanations
 */

export interface TourStop {
  path: string;
  title: string;
  description: string;
  highlights: string[];
  nextPrompt?: string;
}

export const platformTour: TourStop[] = [
  {
    path: '/',
    title: 'Home Dashboard',
    description: 'Your central hub for all platform activities. From here you can access posts, marketplace, events, and connect with the community.',
    highlights: [
      'Feed of recent posts and updates',
      'Quick navigation to all major features',
      'Personalized content recommendations',
      'Global header with search and profile access'
    ],
    nextPrompt: 'Ready to explore the marketplace?'
  },
  {
    path: '/marketplace',
    title: 'Marketplace',
    description: 'Browse and discover items, services, and opportunities shared by the community.',
    highlights: [
      'Filter by categories and search',
      'View detailed listings with images',
      'Flag inappropriate content',
      'Request new categories'
    ],
    nextPrompt: 'Want to see the calendar and events?'
  },
  {
    path: '/calendar',
    title: 'Calendar & Events',
    description: 'Manage your schedule, create events, and coordinate with others.',
    highlights: [
      'View events in calendar format',
      'Create and manage your events',
      'RSVP to community events',
      'Set reminders for important dates'
    ],
    nextPrompt: 'Let me show you the horse registry?'
  },
  {
    path: '/horses',
    title: 'Horse Registry',
    description: 'Comprehensive horse management and tracking system.',
    highlights: [
      'Register and claim horses',
      'Track lineage and ownership',
      'Manage incentive programs',
      'View complete horse profiles'
    ],
    nextPrompt: 'Curious about the business hub?'
  },
  {
    path: '/dashboard',
    title: 'Personal Dashboard',
    description: 'Your personalized overview with AI-powered insights and quick actions.',
    highlights: [
      'Rocker AI assistant integration',
      'Personalized suggestions',
      'Quick access to your content',
      'Activity overview'
    ],
    nextPrompt: 'Want to check out the AI management panel?'
  },
  {
    path: '/ai-management',
    title: 'AI Management',
    description: 'Control what Rocker knows about you and manage AI interactions.',
    highlights: [
      'View and manage your memories',
      'Control data sharing preferences',
      'See what Rocker has learned',
      'Privacy controls for AI data'
    ],
    nextPrompt: 'Ready to see the admin control room?'
  },
  {
    path: '/admin/control-room',
    title: 'Admin Control Room',
    description: 'Comprehensive admin dashboard for platform management and diagnostics.',
    highlights: [
      'Feature flag management',
      'Security scanning and RLS policies',
      'Platform health monitoring',
      'User feedback and moderation tools',
      'Code audit and testing panels',
      'AI analytics and insights'
    ],
    nextPrompt: 'That completes the tour! Where would you like to explore more?'
  }
];

export function getTourStop(path: string): TourStop | undefined {
  return platformTour.find(stop => stop.path === path);
}

export function getNextTourStop(currentPath: string): TourStop | undefined {
  const currentIndex = platformTour.findIndex(stop => stop.path === currentPath);
  if (currentIndex === -1 || currentIndex === platformTour.length - 1) {
    return undefined;
  }
  return platformTour[currentIndex + 1];
}

export function formatTourStop(stop: TourStop): string {
  return `
🎯 **${stop.title}**

${stop.description}

**Key Features:**
${stop.highlights.map(h => `• ${h}`).join('\n')}

${stop.nextPrompt || 'What would you like to explore next?'}
  `.trim();
}
