import { GoogleGenAI, Type } from "@google/genai";
import { SentimentType, TweetData, TopicSummary } from "../types";

export type AIProvider = 'gemini' | 'groq';

export const hasValidKey = (provider: AIProvider = 'gemini') => {
  if (provider === 'gemini') {
    return typeof process.env.API_KEY === 'string' && process.env.API_KEY.length > 0;
  }
  if (provider === 'groq') {
    return typeof process.env.GROQ_API_KEY === 'string' && process.env.GROQ_API_KEY.length > 0;
  }
  return false;
};

const getGeminiAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const geminiModelName = "gemini-2.5-flash";
const groqModelName = "llama-3.1-8b-instant";

// --- GROQ HELPER ---
const callGroq = async (messages: any[], jsonMode: boolean = true) => {
  if (!process.env.GROQ_API_KEY) throw new Error("API_KEY_MISSING");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messages,
        model: groqModelName,
        response_format: jsonMode ? { type: "json_object" } : undefined,
        temperature: 0.5,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `Groq API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "{}";
  } catch (error: any) {
    throw new Error(error.message || "Failed to connect to Groq API");
  }
};

// --- MOCK DATA GENERATORS ---

const MOCK_TEMPLATES = {
  [SentimentType.POSITIVE]: [
    (t: string) => `${t} is absolutely changing the game! loving it.`,
    (t: string) => `Can't wait to get my hands on ${t}!`,
    (t: string) => `Honestly, ${t} is the best thing I've seen all year.`,
    (t: string) => `Huge props to the team behind ${t}. Incredible work.`,
    (t: string) => `I'm obsessed with ${t}. It's just perfect.`,
    (t: string) => `${t} exceeded all my expectations. 10/10.`,
    (t: string) => `Finally tried ${t} and wow... just wow.`,
    (t: string) => `If you haven't checked out ${t} yet, you're missing out!`
  ],
  [SentimentType.NEGATIVE]: [
    (t: string) => `I don't understand the hype around ${t}. It feels overpriced.`,
    (t: string) => `${t} disappointed me today. Expected better performance.`,
    (t: string) => `Not a fan of the new ${t} update. It broke my workflow.`,
    (t: string) => `Why is everyone talking about ${t}? It's actually terrible.`,
    (t: string) => `I regret spending time on ${t}. complete waste.`,
    (t: string) => `${t} is extremely buggy and unstable.`,
    (t: string) => `I tried to like ${t}, but I just can't.`,
    (t: string) => `${t} is the worst release so far.`
  ],
  [SentimentType.NEUTRAL]: [
    (t: string) => `Just saw the news about ${t}. Interesting developments.`,
    (t: string) => `Has anyone else tried ${t}? Curious about your thoughts.`,
    (t: string) => `${t} is exactly what you'd expect. Nothing more, nothing less.`,
    (t: string) => `Still on the fence about ${t}.`,
    (t: string) => `Reading up on the documentation for ${t}.`,
    (t: string) => `Here is a summary of the ${t} launch event.`,
    (t: string) => `${t} is available now globally.`
  ]
};

const getMockAnalysis = (text: string) => {
  const lower = text.toLowerCase();
  let sentiment = SentimentType.NEUTRAL;
  if (lower.includes('love') || lower.includes('best') || lower.includes('perfect') || lower.includes('wow') || lower.includes('game')) sentiment = SentimentType.POSITIVE;
  else if (lower.includes('bad') || lower.includes('worst') || lower.includes('waste') || lower.includes('terrible') || lower.includes('buggy')) sentiment = SentimentType.NEGATIVE;
  
  // Extract pseudo-keywords (words > 4 chars)
  const words = text.split(' ')
    .map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
    .filter(w => w.length > 4 && !w.includes('about') && !w.includes('there'));

  return {
    sentiment,
    score: 0.75 + Math.random() * 0.24,
    reasoning: "Simulated analysis based on keyword matching in Demo Mode.",
    keywords: words.slice(0, 3).length > 0 ? words.slice(0, 3) : ["demo", "analysis"]
  };
};

/**
 * Analyzes a single tweet text for sentiment.
 */
export const analyzeSingleTweet = async (text: string, useMock = false, provider: AIProvider = 'gemini'): Promise<TweetData> => {
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

  let result: any = {};

  if (provider === 'gemini') {
    const ai = getGeminiAI();
    const prompt = `Analyze the sentiment of the following tweet: "${text}". 
    Provide the sentiment (Positive, Negative, Neutral), a confidence score (0.0 to 1.0), 
    a brief reasoning explaining why, and extract up to 3 key keywords relating to the sentiment.`;

    const response = await ai.models.generateContent({
      model: geminiModelName,
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
    result = JSON.parse(response.text || "{}");
  } else if (provider === 'groq') {
    const messages = [
      {
        role: "system",
        content: `You are a sentiment analysis expert. Analyze the tweet. Return a JSON object with this structure: 
        { "sentiment": "Positive" | "Negative" | "Neutral", "score": number (0-1), "reasoning": "string", "keywords": ["string"] }`
      },
      { role: "user", content: `Analyze this tweet: "${text}"` }
    ];
    const jsonStr = await callGroq(messages);
    result = JSON.parse(jsonStr);
  }

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
export const generateAndAnalyzeTopic = async (topic: string, count: number = 15, useMock = false, provider: AIProvider = 'gemini'): Promise<TweetData[]> => {
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate generation delay
    
    return Array.from({ length: count }).map((_, i) => {
      // Randomly select sentiment type
      const rand = Math.random();
      let type = SentimentType.NEUTRAL;
      if (rand > 0.6) type = SentimentType.POSITIVE;
      else if (rand > 0.3) type = SentimentType.NEGATIVE;
      
      const templates = MOCK_TEMPLATES[type];
      const template = templates[Math.floor(Math.random() * templates.length)];
      const text = template(topic);

      // Extract basic keywords from the generated text
      const keywords = text.split(' ')
        .map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
        .filter(w => w.length > 4 && w !== 'about' && w !== 'there')
        .slice(0, 3);
      if (keywords.length === 0) keywords.push(topic.split(' ')[0].toLowerCase());

      return {
        id: crypto.randomUUID(),
        text: text,
        author: `@mock_user_${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        analysis: {
          sentiment: type,
          score: 0.7 + Math.random() * 0.25,
          reasoning: "Simulated analysis in Demo Mode.",
          keywords: keywords
        }
      };
    });
  }

  let rawData: any[] = [];

  if (provider === 'gemini') {
    const ai = getGeminiAI();
    const prompt = `Generate ${count} realistic tweets about the topic "${topic}". 
    Vary the sentiment widely (some positive, some negative, some neutral, some sarcastic).
    For each tweet, provide the tweet text and its sentiment analysis immediately.`;

    const response = await ai.models.generateContent({
      model: geminiModelName,
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
    rawData = JSON.parse(response.text || "[]");

  } else if (provider === 'groq') {
    const messages = [
      {
        role: "system",
        content: `Generate ${count} tweets about "${topic}". Vary sentiment. Return a JSON object with a key "tweets" containing an array of objects.
        Each object must follow this schema: { "text": "tweet content", "sentiment": "Positive" | "Negative" | "Neutral", "score": number, "reasoning": "string", "keywords": ["string"] }`
      },
      { role: "user", content: `Generate tweets about ${topic}` }
    ];
    const jsonStr = await callGroq(messages);
    const parsed = JSON.parse(jsonStr);
    rawData = parsed.tweets || parsed || [];
  }

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
export const explainNLPConcept = async (concept: string, useMock = false, provider: AIProvider = 'gemini'): Promise<string> => {
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return `[DEMO MODE] ${concept} is a fundamental technique in NLP. In a real notebook, this cell would explain how ${concept} transforms raw text into structured data suitable for machine learning models using libraries like NLTK or scikit-learn.`;
  }

  if (provider === 'gemini') {
    const ai = getGeminiAI();
    const prompt = `Explain the NLP concept "${concept}" simply, as if it were a markdown cell in a Kaggle data science notebook. Keep it under 100 words.`;
    const response = await ai.models.generateContent({
      model: geminiModelName,
      contents: prompt,
    });
    return response.text || "Could not generate explanation.";
  } else {
    const messages = [
      { role: "system", content: "You are a data science tutor." },
      { role: "user", content: `Explain the NLP concept "${concept}" simply, as if it were a markdown cell in a Kaggle data science notebook. Keep it under 100 words. Output raw text, not JSON.` }
    ];
    // Note: false for jsonMode
    return await callGroq(messages, false);
  }
};