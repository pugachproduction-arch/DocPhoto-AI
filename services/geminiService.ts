
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async processImage(base64Image: string, prompt: string, bgColor: string): Promise<string> {
    const model = 'gemini-2.5-flash-image';
    
    // Cleaning base64 string
    const data = base64Image.split(',')[1] || base64Image;

    const fullPrompt = `
      Instructions: ${prompt}. 
      Mandatory: Detect the person in the image. Remove the existing background completely. 
      Replace the background with a solid flat color: ${bgColor}. 
      Ensure the lighting on the person looks natural with the new background.
      Keep the person sharp and professional.
      Return the final edited image.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data, mimeType: 'image/png' } },
            { text: fullPrompt }
          ]
        }
      });

      let editedImage = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            editedImage = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!editedImage) throw new Error("AI did not return an image.");
      return editedImage;
    } catch (error) {
      console.error("Gemini Image Process Error:", error);
      throw error;
    }
  }
}
