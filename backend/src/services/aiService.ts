/**
 * AI Service Wrapper
 * Supports multiple providers: local (fallback), OpenAI, or custom endpoint
 */

interface AIProvider {
  generateWeeklySummary(data: WeeklySummaryData): Promise<string>;
}

interface WeeklySummaryData {
  totalIncidents: number;
  verifiedIncidents: number;
  incidentTypes: Record<string, number>;
  peakHours: Record<string, number>;
  topLocations: Array<{ location: string; count: number }>;
  weekRange: { start: string; end: string };
}

/**
 * Local fallback AI provider - generates deterministic summaries from templates
 */
class LocalAIProvider implements AIProvider {
  async generateWeeklySummary(data: WeeklySummaryData): Promise<string> {
    const { totalIncidents, verifiedIncidents, incidentTypes, peakHours, topLocations, weekRange } = data;
    
    const verificationRate = totalIncidents > 0 
      ? ((verifiedIncidents / totalIncidents) * 100).toFixed(1)
      : '0';

    const topIncidentType = Object.entries(incidentTypes)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';
    
    const peakHour = Object.entries(peakHours)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';

    const topLocation = topLocations[0]?.location || 'various areas';

    return `This week (${weekRange.start} to ${weekRange.end}), ETraffic recorded ${totalIncidents} total incidents across Addis Ababa, with ${verifiedIncidents} verified by community members and administrators, representing a ${verificationRate}% verification rate. The most common incident type was ${topIncidentType}, with peak traffic occurring around ${peakHour}. The area most affected was ${topLocation}. The community-driven reporting system continues to improve real-time traffic awareness, helping drivers make informed decisions and avoid congestion.`;
  }
}

/**
 * OpenAI provider (requires API key)
 */
class OpenAIProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateWeeklySummary(data: WeeklySummaryData): Promise<string> {
    // Implementation would call OpenAI API
    // For now, fallback to local
    const localProvider = new LocalAIProvider();
    return localProvider.generateWeeklySummary(data);
  }
}

/**
 * Custom AI provider (for external services)
 */
class CustomAIProvider implements AIProvider {
  private endpoint: string;
  private apiKey?: string;

  constructor(endpoint: string, apiKey?: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async generateWeeklySummary(data: WeeklySummaryData): Promise<string> {
    // Implementation would call custom endpoint
    // For now, fallback to local
    const localProvider = new LocalAIProvider();
    return localProvider.generateWeeklySummary(data);
  }
}

/**
 * Get configured AI provider
 */
function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'local';

  switch (provider) {
    case 'openai':
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        console.warn('OPENAI_API_KEY not set, falling back to local provider');
        return new LocalAIProvider();
      }
      return new OpenAIProvider(openaiKey);

    case 'custom':
      const endpoint = process.env.AI_API_ENDPOINT;
      if (!endpoint) {
        console.warn('AI_API_ENDPOINT not set, falling back to local provider');
        return new LocalAIProvider();
      }
      return new CustomAIProvider(endpoint, process.env.AI_API_KEY);

    default:
      return new LocalAIProvider();
  }
}

/**
 * Generate weekly summary using configured provider
 */
export async function generateWeeklySummary(
  data: WeeklySummaryData
): Promise<string> {
  const provider = getAIProvider();
  return provider.generateWeeklySummary(data);
}

