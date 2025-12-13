export enum SentimentType {
  POSITIVE = 'Positive',
  NEGATIVE = 'Negative',
  NEUTRAL = 'Neutral'
}

export interface SentimentAnalysis {
  sentiment: SentimentType;
  score: number; // 0 to 1 confidence
  reasoning: string;
  keywords: string[];
}

export interface TweetData {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  analysis?: SentimentAnalysis;
}

export interface TopicSummary {
  topic: string;
  totalTweets: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  commonKeywords: { word: string; count: number }[];
}

// Define specific chart data types for Recharts
export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface BarChartData {
  name: string;
  count: number;
}