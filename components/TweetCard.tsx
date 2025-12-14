import React from 'react';
import { TweetData, SentimentType } from '../types';
import { MessageCircle, Heart, Share2, MoreHorizontal } from 'lucide-react';

interface TweetCardProps {
  tweet: TweetData;
}

const getSentimentEmoji = (sentiment: SentimentType, score: number) => {
  // High confidence (>70%)
  if (score >= 0.7) {
    switch (sentiment) {
      case SentimentType.POSITIVE: return '🤩'; // Star-struck
      case SentimentType.NEGATIVE: return '🤬'; // Symbol over mouth
      case SentimentType.NEUTRAL: return '😐'; // Neutral face
    }
  }
  // Medium confidence (>40%)
  if (score >= 0.4) {
    switch (sentiment) {
      case SentimentType.POSITIVE: return '😃'; // Grinning
      case SentimentType.NEGATIVE: return '😠'; // Angry
      case SentimentType.NEUTRAL: return '😶'; // No mouth
    }
  }
  // Low confidence
  switch (sentiment) {
    case SentimentType.POSITIVE: return '🙂'; // Slightly smiling
    case SentimentType.NEGATIVE: return '😒'; // Unamused
    case SentimentType.NEUTRAL: return '🤔'; // Thinking
  }
  return '😶';
};

const SentimentBadge: React.FC<{ sentiment: SentimentType; score: number }> = ({ sentiment, score }) => {
  const colors = {
    [SentimentType.POSITIVE]: 'bg-green-100 text-green-800 border-green-200',
    [SentimentType.NEGATIVE]: 'bg-red-100 text-red-800 border-red-200',
    [SentimentType.NEUTRAL]: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const emoji = getSentimentEmoji(sentiment, score);

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[sentiment]} flex items-center gap-1.5 shadow-sm`}>
      <span className="text-base leading-none" role="img" aria-label={sentiment}>{emoji}</span>
      <span className="font-semibold">{sentiment}</span>
      <span className="opacity-70 font-mono text-[10px]">{(score * 100).toFixed(0)}%</span>
    </span>
  );
};

export const TweetCard: React.FC<TweetCardProps> = ({ tweet }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
            {tweet.author[1].toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 truncate">Twitter User</span>
              <span className="text-gray-500 text-sm truncate">{tweet.author}</span>
              <span className="text-gray-400 text-xs">• now</span>
            </div>
            {tweet.analysis && (
              <SentimentBadge sentiment={tweet.analysis.sentiment} score={tweet.analysis.score} />
            )}
          </div>
          
          <p className="text-gray-800 text-sm leading-relaxed mb-3">
            {tweet.text}
          </p>
          
          {tweet.analysis && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs mb-3 border border-slate-100">
              <p className="font-semibold text-slate-700 mb-1">Analysis Reasoning:</p>
              <p className="text-slate-600 italic mb-2">"{tweet.analysis.reasoning}"</p>
              <div className="flex flex-wrap gap-1">
                {tweet.analysis.keywords.map((kw, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium border border-blue-100">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between text-gray-400 max-w-xs">
            <button className="hover:text-blue-500 transition-colors"><MessageCircle size={16} /></button>
            <button className="hover:text-green-500 transition-colors"><Share2 size={16} /></button>
            <button className="hover:text-red-500 transition-colors"><Heart size={16} /></button>
            <button className="hover:text-blue-500 transition-colors"><MoreHorizontal size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};