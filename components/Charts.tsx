import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TweetData, PieChartData, BarChartData, SentimentType } from '../types';

interface ChartsProps {
  tweets: TweetData[];
}

const COLORS = {
  [SentimentType.POSITIVE]: '#22c55e', // green-500
  [SentimentType.NEGATIVE]: '#ef4444', // red-500
  [SentimentType.NEUTRAL]: '#94a3b8',  // slate-400
};

export const SentimentDistributionChart: React.FC<ChartsProps> = ({ tweets }) => {
  const dataMap = tweets.reduce((acc, tweet) => {
    const s = tweet.analysis?.sentiment || SentimentType.NEUTRAL;
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data: PieChartData[] = Object.keys(dataMap).map(key => ({
    name: key,
    value: dataMap[key],
    color: COLORS[key as SentimentType]
  }));

  if (tweets.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const KeywordBarChart: React.FC<ChartsProps> = ({ tweets }) => {
  const keywordCounts = tweets.reduce((acc, tweet) => {
    tweet.analysis?.keywords.forEach(kw => {
      const lower = kw.toLowerCase();
      acc[lower] = (acc[lower] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const data: BarChartData[] = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) // Top 5 keywords
    .map(([name, count]) => ({ name, count }));

  if (tweets.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={80} tick={{fill: '#94a3b8', fontSize: 12}} />
          <RechartsTooltip 
            cursor={{fill: '#334155', opacity: 0.2}}
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};