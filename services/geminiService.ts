
import { GoogleGenAI } from "@google/genai";

export const GeminiService = {
  async askAI(question: string, history: {role: string, parts: {text: string}[]}[] = []) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `Ты - профессиональный образовательный ассистент и наставник в цифровом колледже EduControl. 
    Твоя цель: помогать студентам и преподавателям в вопросах образования, науки, карьеры и саморазвития. 
    Отвечай четко, вдохновляюще и грамотно на языке пользователя (русский или кыргызский). 
    Если вопрос не касается образования или колледжа, старайся вежливо вернуть беседу в академическое русло.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts: [{ text: question }] }],
        config: {
            systemInstruction
        }
      });
      return response.text;
    } catch (error) {
      console.error("AI Chat Error:", error);
      return "Извините, сейчас я не могу ответить. Попробуйте позже.";
    }
  },

  async generateStudentReport(studentName: string, performanceData: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Проанализируй успеваемость студента и дай 3 совета на русском.
    Студент: ${studentName}
    Данные: ${JSON.stringify(performanceData)}`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      return response.text;
    } catch (error) {
      return "Ошибка анализа.";
    }
  },

  async generateCollectiveReport(aggregateData: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Проанализируй общую успеваемость, посещаемость и состояние колледжа на основе этих данных. 
    Составь профессиональный и структурированный аналитический отчет для администрации (на русском языке).
    Выдели:
    1. Общие тренды (успеваемость vs посещаемость).
    2. Группы-лидеры и группы, требующие внимания.
    3. Конкретные рекомендации по улучшению образовательного процесса.
    Данные для анализа: ${JSON.stringify(aggregateData)}`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
      });
      return response.text;
    } catch (error) {
      console.error("Collective AI Analysis Error:", error);
      return "Не удалось сформировать отчет. Пожалуйста, попробуйте еще раз.";
    }
  }
};
