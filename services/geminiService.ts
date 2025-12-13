import { GoogleGenAI, Type } from "@google/genai";
import { SentimentType, TweetData, TopicSummary } from "../types";

// Helper to get the AI instance lazily. 
// This prevents the app from crashing on load if the API_KEY is missing in the environment.
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
    // We return a dummy object or throw a handled error if preferred, 
    // but the SDK requires a key. 
  }
  return new GoogleGenAI({ apiKey: apiKey || "dummy_key_to_prevent_crash" });
};

const modelName = "gemini-2.5-flash";

/**
 * Analyzes a single tweet text for sentiment.
 */
export const analyzeSingleTweet = async (text: string): Promise<TweetData> => {
  const ai = getAI();
  const prompt = `Analyze the sentiment of the following tweet: "${text}". 
  Provide the sentiment (Positive, Negative, Neutral), a confidence score (0.0 to 1.0), 
  a brief reasoning explaining why, and extract up to 3 key keywords relating to the sentiment.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING, enum: [SentimentType.POSITIVE, SentimentType.NEGATIVE, SentimentType.NEUTRAL] },
          score: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
          keywords: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          }
        },
        required: ["sentiment", "score", "reasoning", "keywords"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");

  return {
    id: crypto.randomUUID(),
    text: text,
    author: "@currentUser",
    timestamp: new Date().toISOString(),
    analysis: {
      sentiment: result.sentiment,
      score: result.score,
      reasoning: result.reasoning,
      keywords: result.keywords || []
    }
  };
};

/**
 * Simulates the "Dataset Generation" part of a notebook.
 * Generates synthetic tweets about a topic and analyzes them in batch.
 */
export const generateAndAnalyzeTopic = async (topic: string, count: number = 15): Promise<TweetData[]> => {
  const ai = getAI();
  const prompt = `Generate ${count} realistic tweets about the topic "${topic}". 
  Vary the sentiment widely (some positive, some negative, some neutral, some sarcastic).
  For each tweet, provide the tweet text and its sentiment analysis immediately.
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: [SentimentType.POSITIVE, SentimentType.NEGATIVE, SentimentType.NEUTRAL] },
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["text", "sentiment", "score", "reasoning", "keywords"]
        }
      }
    }
  });

  const rawData = JSON.parse(response.text || "[]");

  return rawData.map((item: any) => ({
    id: crypto.randomUUID(),
    text: item.text,
    author: `@user_${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString(),
    analysis: {
      sentiment: item.sentiment,
      score: item.score,
      reasoning: item.reasoning,
      keywords: item.keywords
    }
  }));
};

/**
 * Educational helper: Explains a specific NLP concept as if reading a notebook markdown cell.
 */
export const explainNLPConcept = async (concept: string): Promise<string> => {
  const ai = getAI();
  const prompt = `Explain the NLP concept "${concept}" simply, as if it were a markdown cell in a Kaggle data science notebook. Keep it under 100 words.`;
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  return response.text || "Could not generate explanation.";
};