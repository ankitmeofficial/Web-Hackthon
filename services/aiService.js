import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyA9HF0Q-EHCVhudJ4eIfCEQ7SI3oXxWvNU" });

export async function generateAIResponse(history) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: history,
    config: {
      systemInstruction: `You are Dr. Cupper...` // Your existing instruction
    }
  });
  return response.text;
}