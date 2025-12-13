import { GoogleGenAI, Type } from "@google/genai";
import { SentimentType, TweetData, TopicSummary } from "../types";

export const hasValidKey = () => {
  return typeof process.env.API_KEY === 'string' && process.env.API_KEY.length > 0;
};

const getAI = () => {
  if (!hasValidKey()) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const modelName = "gemini-2.5-flash";

// --- MOCK DATA GENERATORS ---

const getMockAnalysis = (text: string) => {
  const isPositive = text.toLowerCase().includes('good') || text.toLowerCase().includes('love') || text.toLowerCase().includes('amazing');
  const isNegative = text.toLowerCase().includes('bad') || text.toLowerCase().includes('hate') || text.toLowerCase().includes('terrible');
  
  let sentiment = SentimentType.NEUTRAL;
  if (isPositive) sentiment = SentimentType.POSITIVE;
  if (isNegative) sentiment = SentimentType.NEGATIVE;

  return {
    sentiment,
    score: 0.85 + Math.random() * 0.14,
    reasoning: "This is a simulated analysis based on keyword matching in Demo Mode.",
    keywords: ["demo", "simulation", "mock"]
  };
};

/**
 * Analyzes a single tweet text for sentiment.
 */
export const analyzeSingleTweet = async (text: string, useMock = false): Promise<TweetData> => {
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    return {
      id: crypto.randomUUID(),
      text: text,
      author: "@DemoUser",
      timestamp: new Date().toISOString(),
      analysis: getMockAnalysis(text)
    };
  }

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
export const generateAndAnalyzeTopic = async (topic: string, count: number = 15, useMock = false): Promise<TweetData[]> => {
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate generation delay
    const mockTweets = [
      { text: `${topic} is absolutely changing the game! loving it.`, sentiment: SentimentType.POSITIVE },
      { text: `I don't understand the hype around ${topic}. It feels overpriced.`, sentiment: SentimentType.NEGATIVE },
      { text: `Just saw the news about ${topic}. Interesting developments.`, sentiment: SentimentType.NEUTRAL },
      { text: `Can't wait to get my hands on ${topic}!`, sentiment: SentimentType.POSITIVE },
      { text: `${topic} disappointed me today. Expected better performance.`, sentiment: SentimentType.NEGATIVE },
    ];
    
    // Generate 'count' items by cycling through the mock templates
    return Array.from({ length: count }).map((_, i) => {
      const template = mockTweets[i % mockTweets.length];
      return {
        id: crypto.randomUUID(),
        text: template.text,
        author: `@mock_user_${i}`,
        timestamp: new Date().toISOString(),
        analysis: {
          sentiment: template.sentiment,
          score: 0.7 + Math.random() * 0.2,
          reasoning: "Simulated analysis in Demo Mode.",
          keywords: [topic.toLowerCase(), "demo", "simulated"]
        }
      };
    });
  }

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
export const explainNLPConcept = async (concept: string, useMock = false): Promise<string> => {
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return `[DEMO MODE] ${concept} is a fundamental technique in NLP. In a real notebook, this cell would explain how ${concept} transforms raw text into structured data suitable for machine learning models using libraries like NLTK or scikit-learn.`;
  }

  const ai = getAI();
  const prompt = `Explain the NLP concept "${concept}" simply, as if it were a markdown cell in a Kaggle data science notebook. Keep it under 100 words.`;
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  return response.text || "Could not generate explanation.";
};