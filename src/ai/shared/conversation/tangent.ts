/**
 * Tangent Detection & Topic Drift
 * Detects when conversation switches topics
 */

export interface TopicChange {
  detected: boolean;
  prevTopic: string;
  newTopic: string;
  confidence: number;
}

/**
 * Detect if conversation has shifted to a new topic
 */
export function detectTangent(
  prevTopic: string,
  newText: string,
  threshold: number = 0.5
): boolean {
  if (!prevTopic || !newText) return false;
  
  const prevWords = new Set(prevTopic.toLowerCase().split(/\s+/));
  const newWords = newText.toLowerCase().split(/\s+/);
  
  // Calculate word overlap
  let overlap = 0;
  for (const word of newWords) {
    if (prevWords.has(word) && word.length > 3) {
      overlap++;
    }
  }
  
  const overlapRatio = overlap / Math.max(prevWords.size, newWords.length);
  return overlapRatio < threshold;
}

/**
 * Infer topic from text (simple extraction)
 */
export function inferTopic(text: string): string {
  // Take first meaningful sentence or first 64 chars
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    return sentences[0].trim().slice(0, 64);
  }
  return text.slice(0, 64).toLowerCase();
}

/**
 * Analyze topic change with confidence
 */
export function analyzeTopicChange(
  prevTopic: string,
  newText: string
): TopicChange {
  const newTopic = inferTopic(newText);
  const detected = detectTangent(prevTopic, newText);
  
  // Simple confidence based on word overlap
  const prevWords = new Set(prevTopic.toLowerCase().split(/\s+/));
  const newWords = newText.toLowerCase().split(/\s+/);
  let overlap = 0;
  
  for (const word of newWords) {
    if (prevWords.has(word) && word.length > 3) {
      overlap++;
    }
  }
  
  const confidence = 1 - (overlap / Math.max(prevWords.size, newWords.length, 1));
  
  return {
    detected,
    prevTopic,
    newTopic,
    confidence,
  };
}
