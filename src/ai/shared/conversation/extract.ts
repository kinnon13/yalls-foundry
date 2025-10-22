/**
 * Goal Extraction from Messages
 * Uses AI to extract actionable tasks from conversation
 */

export interface ExtractedGoal {
  title: string;
  description?: string;
  steps?: string[];
  priority: number;
  dueAt?: Date;
}

/**
 * Extract goals from user message using AI
 * TODO: Integrate with Lovable AI for structured extraction
 */
export async function extractGoalsFromMessage(
  message: string,
  context?: Record<string, any>
): Promise<ExtractedGoal[]> {
  // Stub implementation - will use Lovable AI with tool calling
  // for structured output extraction
  
  // Simple keyword-based extraction for now
  const goals: ExtractedGoal[] = [];
  
  const taskKeywords = ['build', 'create', 'add', 'implement', 'fix', 'update', 'refactor', 'design'];
  const lowerMessage = message.toLowerCase();
  
  for (const keyword of taskKeywords) {
    if (lowerMessage.includes(keyword)) {
      const title = message.slice(0, 100);
      goals.push({
        title,
        priority: 5,
        steps: [],
      });
      break;
    }
  }
  
  return goals;
}

/**
 * Extract steps from goal description
 */
export function extractSteps(description: string): string[] {
  const lines = description.split('\n').filter(line => line.trim());
  const steps: string[] = [];
  
  for (const line of lines) {
    if (/^[-*\d.]\s/.test(line.trim())) {
      steps.push(line.trim().replace(/^[-*\d.]\s/, ''));
    }
  }
  
  return steps.length > 0 ? steps : [description];
}
