
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async processImage(base64Image: string, prompt: string, bgColor: string): Promise<string> {
    const model = 'gemini-2.5-flash-image';
    
    // Очистка строки Base64 от префикса data:image/...;base64,
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const fullPrompt = `
      Action: Detect the person and background.
      Task: Replace the background with the solid color ${bgColor}.
      Edit instructions: ${prompt}.
      Style: Professional document photography. Ensure sharp edges and natural lighting on the subject.
      Output: Return only the processed image.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: {
          parts: [
            { 
              inlineData: { 
                data: base64Data, 
                mimeType: 'image/jpeg' 
              } 
            },
            { text: fullPrompt }
          ]
        }
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("API не вернуло результат");
      }

      const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
      
      if (imagePart?.inlineData?.data) {
        return `data:image/png;base64,${imagePart.inlineData.data}`;
      }

      throw new Error("Изображение не найдено в ответе API");
    } catch (error: any) {
      console.error("Gemini AI Error:", error);
      throw new Error(error.message || "Ошибка при обращении к ИИ");
    }
  }
}
