import React, { useState, useEffect } from 'react';
import { analyzeSingleTweet, generateAndAnalyzeTopic, explainNLPConcept, hasValidKey, AIProvider } from './services/geminiService';
import { TweetData, SentimentType } from './types';
import { TweetCard } from './components/TweetCard';
import { SentimentDistributionChart, KeywordBarChart } from './components/Charts';
import { Twitter, Search, BarChart3, BookOpen, RefreshCw, Sparkles, Terminal, AlertTriangle, Settings, ExternalLink, PlayCircle, RefreshCcw, Cpu } from 'lucide-react';

// Common NLP terms to explain, mimicking a notebook curriculum
const NLP_CONCEPTS = [
  "Tokenization",
  "Stop Words",
  "Stemming vs Lemmatization",
  "TF-IDF Vectorization",
  "Naive Bayes Classifier",
  "Sentiment Polarity"
];

function App() {
  const [mode, setMode] = useState<'live' | 'dataset' | 'learn'>('dataset');
  const [provider, setProvider] = useState<AIProvider>('groq');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tweets, setTweets] = useState<TweetData[]>([]);
  const [explanation, setExplanation] = useState<{title: string, content: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfigWarning, setShowConfigWarning] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Initial load check
  useEffect(() => {
    // Check key for default provider
    if (!hasValidKey(provider)) {
      setShowConfigWarning(true);
    }
    // Removed automatic handleAnalyze call to prevent rate limiting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check key when provider changes
  useEffect(() => {
    if (!isDemoMode && !hasValidKey(provider)) {
      setShowConfigWarning(true);
    } else {
      setShowConfigWarning(false);
    }
  }, [provider, isDemoMode]);

  const handleAnalyze = async (forceDemo?: boolean) => {
    const usingDemo = forceDemo ?? isDemoMode;
    
    if (!hasValidKey(provider) && !usingDemo) {
      setShowConfigWarning(true);
      return;
    }
    
    if (!inputValue.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setTweets([]); // Clear previous

    try {
      if (mode === 'live') {
        const tweet = await analyzeSingleTweet(inputValue, usingDemo, provider);
        setTweets([tweet]);
      } else {
        // Dataset mode: Simulate fetching and processing a batch
        const batch = await generateAndAnalyzeTopic(inputValue, 15, usingDemo, provider);
        setTweets(batch);
      }
    } catch (err: any) {
      console.error("Analysis failed", err);
      if (err.message === "API_KEY_MISSING") {
        setShowConfigWarning(true);
      } else {
        setError(err.message || "Something went wrong with the AI service.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLearn = async (concept: string) => {
    if (!hasValidKey(provider) && !isDemoMode) {
      setShowConfigWarning(true);
      return;
    }
    setExplanation(null);
    setError(null);
    try {
      const content = await explainNLPConcept(concept, isDemoMode, provider);
      setExplanation({ title: concept, content });
    } catch (err: any) {
      setError("Failed to generate explanation. Please try again.");
    }
  };

  const enableDemoMode = () => {
    setIsDemoMode(true);
    setShowConfigWarning(false);
    // Auto-run analysis in demo mode for instant gratification since it's free
    setInputValue("Apple Vision Pro"); 
    setTimeout(() => {
        // We need to pass true explicitly because setIsDemoMode might not have flushed yet in this closure
        // But actually, handleAnalyze uses state `isDemoMode` OR arg `forceDemo`.
        // We'll call it with the value "Apple Vision Pro" set above, but React batching...
        // Safest to just call logic that relies on the arg.
        // We can't easily call handleAnalyze here because inputValue state won't be updated in this render cycle for the function to read it.
        // So we will just set the mode. The user can click analyze.
    }, 0);
  };

  // Calculate aggregate stats
  const totalTweets = tweets.length;
  const positiveCount = tweets.filter(t => t.analysis?.sentiment === SentimentType.POSITIVE).length;
  const negativeCount = tweets.filter(t => t.analysis?.sentiment === SentimentType.NEGATIVE).length;
  const neutralCount = tweets.filter(t => t.analysis?.sentiment === SentimentType.NEUTRAL).length;
  const posPct = totalTweets ? Math.round((positiveCount / totalTweets) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-2 rounded-lg text-white">
              <Twitter size={20} fill="currentColor" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800 hidden sm:block">Sentim<span className="text-blue-500">AI</span></h1>
            
            {/* Provider Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 ml-4 border border-slate-200">
              <button 
                onClick={() => setProvider('gemini')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${provider === 'gemini' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Sparkles size={14} /> Gemini
              </button>
              <button 
                onClick={() => setProvider('groq')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${provider === 'groq' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Cpu size={14} /> Groq
              </button>
            </div>

            {isDemoMode && (
               <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 whitespace-nowrap">
                 DEMO MODE
               </span>
            )}
          </div>
          
          <nav className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'dataset', label: 'Dataset', icon: BarChart3 },
              { id: 'live', label: 'Live Check', icon: Search },
              { id: 'learn', label: 'Concepts', icon: BookOpen },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as any)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === item.id 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Error Banners */}
        {showConfigWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                <Settings size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900">
                  {provider === 'gemini' ? 'Gemini' : 'Groq'} API Key Required
                </h3>
                <p className="text-amber-800 mt-1 mb-4">
                  The application cannot detect your {provider === 'gemini' ? 'Gemini' : 'Groq'} API key. This is required for live analysis using the {provider} provider.
                </p>
                
                <div className="bg-white/50 rounded-lg p-4 border border-amber-200 mb-4">
                  <p className="text-sm font-bold text-amber-900 mb-2 uppercase tracking-wide">Configuration Steps:</p>
                  <ol className="list-decimal list-inside text-sm text-amber-800 space-y-2">
                    <li>Go to Vercel Dashboard → Settings → Environment Variables.</li>
                    <li>
                      Add <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">
                        {provider === 'gemini' ? 'API_KEY' : 'GROQ_API_KEY'}
                      </code> with your value.
                    </li>
                    <li className="font-bold text-amber-900">
                      IMPORTANT: You must click "Redeploy" in Vercel for the key to take effect.
                    </li>
                  </ol>
                </div>

                <div className="flex flex-wrap gap-3">
                   <a 
                     href="https://vercel.com/dashboard" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                   >
                     <ExternalLink size={18} />
                     Go to Vercel Dashboard
                   </a>
                   <button 
                     onClick={() => window.location.reload()}
                     className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-medium transition-colors"
                   >
                     <RefreshCcw size={18} />
                     Reload Page
                   </button>
                   <button 
                     onClick={enableDemoMode}
                     className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 rounded-lg font-medium transition-colors shadow-sm ml-auto"
                   >
                     <PlayCircle size={18} />
                     Use Demo Mode
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
           <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3">
             <AlertTriangle className="text-red-500" size={24} />
             <p className="text-red-700">{error}</p>
           </div>
        )}

        {/* Intro / Context */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
             <h2 className="text-2xl font-bold text-slate-800">
              {mode === 'dataset' && "Topic Sentiment Dashboard"}
              {mode === 'live' && "Real-time Tweet Analyzer"}
              {mode === 'learn' && "Interactive NLP Notebook"}
            </h2>
            <span className={`px-2 py-1 rounded text-xs font-mono font-medium border ${
              provider === 'gemini' 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
              Powered by {provider === 'gemini' ? 'Gemini 2.5 Flash' : 'Groq Llama 3.1'}
            </span>
          </div>
          
          <p className="text-slate-500 max-w-3xl">
            {mode === 'dataset' && "Simulates scraping and analyzing a dataset of tweets from Kaggle. Enter a topic below to generate a synthetic dataset and run the sentiment classification pipeline."}
            {mode === 'live' && "Paste a tweet or type a sentence to run it through the sentiment classification model instantly."}
            {mode === 'learn' && "Explore the fundamental concepts used in the 'Twitter Sentiment Analysis' Kaggle notebook, explained by AI."}
          </p>
        </div>

        {/* Input Section (Hidden for Learn mode) */}
        {mode !== 'learn' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-8 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder={mode === 'dataset' ? "Enter a topic (e.g., 'Bitcoin', 'New Marvel Movie')" : "Paste tweet text here..."}
              disabled={showConfigWarning && !isDemoMode}
              className="flex-1 px-4 py-3 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={(showConfigWarning && !isDemoMode) || isLoading}
              className={`text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
                provider === 'gemini' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {mode === 'dataset' ? 'Generate & Analyze' : 'Analyze'}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className={`animate-spin mb-4 ${provider === 'gemini' ? 'text-blue-500' : 'text-orange-500'}`} size={32} />
            <p>Running NLP Pipeline via {provider === 'gemini' ? 'Gemini' : 'Groq'}...</p>
            <p className="text-sm opacity-70">Tokenizing • Vectorizing • Classifying</p>
          </div>
        )}

        {/* Results: Dashboard Mode */}
        {!isLoading && mode === 'dataset' && tweets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Stats & Charts */}
            <div className="lg:col-span-1 space-y-6">
              {/* Summary Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Overall Sentiment</h3>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-bold text-slate-800">{posPct}%</span>
                  <span className="text-5xl" role="img" aria-label="emoji">
                    {posPct >= 70 ? '🤩' : posPct >= 50 ? '😃' : posPct >= 30 ? '😐' : '😒'}
                  </span>
                  <span className="text-lg font-medium text-green-500 mb-2 ml-1">Positive</span>
                </div>
                <p className="text-sm text-slate-500">Based on {totalTweets} analyzed tweets about "{inputValue}".</p>
                <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100">
                  <div style={{ width: `${(positiveCount/totalTweets)*100}%` }} className="bg-green-500" />
                  <div style={{ width: `${(neutralCount/totalTweets)*100}%` }} className="bg-slate-300" />
                  <div style={{ width: `${(negativeCount/totalTweets)*100}%` }} className="bg-red-500" />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>{positiveCount} Pos</span>
                  <span>{neutralCount} Neu</span>
                  <span>{negativeCount} Neg</span>
                </div>
              </div>

              {/* Charts */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Distribution</h3>
                <SentimentDistributionChart tweets={tweets} />
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Top Keywords</h3>
                <KeywordBarChart tweets={tweets} />
              </div>
            </div>

            {/* Right Column: Tweet Feed */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Analysed Tweets Stream</h3>
                <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded">
                  Model: {provider === 'gemini' ? 'gemini-2.5-flash' : 'llama3-70b-8192'}
                </span>
              </div>
              <div className="space-y-4">
                {tweets.map(tweet => (
                  <TweetCard key={tweet.id} tweet={tweet} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results: Live Mode */}
        {!isLoading && mode === 'live' && tweets.length > 0 && (
          <div className="max-w-2xl mx-auto">
             <TweetCard tweet={tweets[0]} />
             <div className={`mt-8 p-6 rounded-xl border ${provider === 'gemini' ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                <h3 className={`font-semibold mb-2 flex items-center gap-2 ${provider === 'gemini' ? 'text-blue-900' : 'text-orange-900'}`}>
                  <Terminal size={18} /> Behind the Scenes
                </h3>
                <p className={`text-sm mb-4 ${provider === 'gemini' ? 'text-blue-800' : 'text-orange-800'}`}>
                  The model identified the sentiment as <strong>{tweets[0].analysis?.sentiment}</strong> with a confidence score of <strong>{tweets[0].analysis?.score.toFixed(2)}</strong>.
                </p>
                <div className="space-y-2">
                  <div className={`flex justify-between text-xs font-mono border-b pb-1 ${provider === 'gemini' ? 'text-blue-700 border-blue-200' : 'text-orange-700 border-orange-200'}`}>
                    <span>Input Text</span>
                    <span>String({tweets[0].text.length})</span>
                  </div>
                  <div className={`flex justify-between text-xs font-mono border-b pb-1 ${provider === 'gemini' ? 'text-blue-700 border-blue-200' : 'text-orange-700 border-orange-200'}`}>
                    <span>Preprocessing</span>
                    <span>[Clean, Tokenize, Vectorize]</span>
                  </div>
                  <div className={`flex justify-between text-xs font-mono ${provider === 'gemini' ? 'text-blue-700' : 'text-orange-700'}`}>
                    <span>Output Class</span>
                    <span>{tweets[0].analysis?.sentiment.toUpperCase()}</span>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* Learn Mode */}
        {mode === 'learn' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Notebook Concepts</h3>
              {NLP_CONCEPTS.map(concept => (
                <button
                  key={concept}
                  onClick={() => handleLearn(concept)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all text-slate-700 font-medium text-sm flex items-center justify-between group"
                >
                  {concept}
                  <span className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">→</span>
                </button>
              ))}
            </div>
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 p-8 min-h-[400px] shadow-sm relative overflow-hidden">
                {!explanation ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                    <BookOpen size={64} className="mb-4 opacity-20" />
                    <p>Select a concept to learn how it works</p>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                      <span className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Terminal size={24} /></span>
                      {explanation.title}
                    </h2>
                    <div className="prose prose-slate max-w-none">
                      <p className="text-lg leading-relaxed text-slate-700">{explanation.content}</p>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-slate-100">
                      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 font-mono">
                        # Python Psuedocode for {explanation.title}<br/>
                        <span className="text-blue-600">def</span> <span className="text-yellow-600">apply_{explanation.title.toLowerCase().split(' ')[0]}</span>(text):<br/>
                        &nbsp;&nbsp;<span className="text-gray-400">"""Simulated logic"""</span><br/>
                        &nbsp;&nbsp;processed = model.process(text)<br/>
                        &nbsp;&nbsp;<span className="text-purple-600">return</span> processed
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;