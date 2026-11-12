import { EducationalLevel, SubjectArea } from '../types/minerd';

export interface AIGeneratePlanRequest {
  planType: 'daily' | 'weekly' | 'unit';
  level: EducationalLevel;
  grade: string;
  area: SubjectArea | string;
  topic: string;
  teacherPrompt?: string;
}

export const aiAssistantService = {
  async generatePlan(params: AIGeneratePlanRequest): Promise<{ source: string; data: any }> {
    const response = await fetch('/api/ai/generate-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Error al generar con IA: ${response.statusText}`);
    }

    return response.json();
  }
};
