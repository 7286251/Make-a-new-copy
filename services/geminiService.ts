import { GoogleGenAI, Type } from "@google/genai";
import { ThemeItem } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeTheme = async (theme: ThemeItem): Promise<{ analysis: string, features: string[] }> => {
  try {
    const ai = getAiClient();
    
    const prompt = `
      Analyze this fictional UI theme designed in "Neo-Brutalism" style.
      Theme Name: ${theme.name}
      Category: ${theme.category}
      Tags: ${theme.tags.join(', ')}
      
      Please provide:
      1. A short, catchy marketing description (max 50 words) that emphasizes its "raw", "bold", and "high-contrast" aesthetic.
      2. A list of 3-4 key visual features one might expect (e.g., "Hard shadows", "Thick borders").
      
      Tone: Excited, trendy, design-focused.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            features: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    
    return {
      analysis: "无法生成分析，请稍后再试。",
      features: ["Bold Borders", "High Contrast", "Raw Typography"]
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback if API key is missing or fails
    return {
        analysis: "这个主题采用了典型的新粗野主义风格，通过高对比度的色彩和厚重的边框，传达出一种不妥协的视觉冲击力。",
        features: ["高饱和色彩", "几何分割布局", "复古打印字体"]
    };
  }
};