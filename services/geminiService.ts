
import { GoogleGenAI, Type } from "@google/genai";
import { Question, TestConfig } from "../types";

// Always use process.env.API_KEY and named parameter for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTestQuestions = async (config: TestConfig): Promise<Question[]> => {
  // Use gemini-3-flash-preview for basic text tasks like quiz generation
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are an expert teacher creating an exam paper for a coaching institute.
    Create a multiple-choice test based on the following configuration:
    - Subject: ${config.subject}
    - Specific Topic: ${config.topic}
    - Difficulty Level: ${config.difficulty}
    - Language: ${config.language} (If Hindi or Hinglish, ensure the text is readable and grammatically correct)
    - Number of Questions: ${config.questionCount}

    Ensure the questions are strictly relevant to the topic.
    For each question, provide 4 distinct options.
    Identify the correct answer.
    Provide a brief explanation for the answer.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              questionText: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["id", "questionText", "options", "correctAnswer"],
          },
        },
      },
    });

    // Correctly access text property (not a function call)
    const text = response.text;
    if (!text) {
        throw new Error("No response text from Gemini");
    }
    
    const questions = JSON.parse(text.trim()) as Question[];
    return questions;

  } catch (error) {
    console.error("Error generating test:", error);
    throw error;
  }
};