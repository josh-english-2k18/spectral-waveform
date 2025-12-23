
import { GoogleGenAI, Type } from "@google/genai";
import { SonicInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSpectralProfile = async (trackName: string): Promise<SonicInsight | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the track titled "${trackName}". Provide a professional sonic profile including its mood, expected spectral characteristics across Sub/Mid/High ranges, and engineering advice for mixing similar audio.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING },
            spectralProfile: { type: Type.STRING },
            engineeringAdvice: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["mood", "spectralProfile", "engineeringAdvice", "tags"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as SonicInsight;
    }
    return null;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return null;
  }
};
