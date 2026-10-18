import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export type InterestAnswers = Record<string, number[]>;

export type CareerModelScore = {
  model: { name: string; version: string; type: string };
  families: { code: string; name: string; probability: number; profiles?: string[] }[];
  profiles: Record<string, number>;
  explanations: {
    family: string;
    probability: number;
    scale_contributions: Record<string, number>;
  }[];
};

/**
 * Client for the ML career-family model served by agentic-ai
 * (/career-prediction/v2). Every call is best-effort: on any error or timeout
 * it returns null and the assessment falls back to the rule-based scorer.
 */
@Injectable()
export class CareerModelClient {
  private readonly logger = new Logger(CareerModelClient.name);
  private readonly baseUrl = (
    process.env['AGENTIC_AI_SERVICE_URL'] || 'http://localhost:8000'
  ).replace(/\/$/, '');
  private readonly timeoutMs = Number(process.env['CAREER_MODEL_TIMEOUT_MS'] || 2500);
  private readonly enabled = process.env['CAREER_MODEL_ENABLED'] !== 'false';

  async score(answers: InterestAnswers): Promise<CareerModelScore | null> {
    if (!Object.values(answers).some((items) => items.length)) return null;
    return this.post<CareerModelScore>('/score', { answers });
  }

  async nextScale(answers: InterestAnswers, allowed: string[]): Promise<string | null> {
    if (!allowed.length) return null;
    const result = await this.post<{ ranking: { scale: string }[] }>(
      '/next-scale',
      { answers, allowed }
    );
    return result?.ranking?.[0]?.scale ?? null;
  }

  private async post<T>(path: string, body: unknown): Promise<T | null> {
    const token = process.env['AGENTIC_INTERNAL_TOKEN']?.trim();
    if (!this.enabled || !token) return null;
    try {
      const response = await axios.post(
        `${this.baseUrl}/career-prediction/v2${path}`,
        body,
        { timeout: this.timeoutMs, headers: { 'X-Internal-Token': token } }
      );
      return response.data as T;
    } catch (error) {
      this.logger.warn(
        `Career model ${path} unavailable, using rule-based fallback: ${
          axios.isAxiosError(error) ? error.response?.status || error.code : String(error)
        }`
      );
      return null;
    }
  }
}
