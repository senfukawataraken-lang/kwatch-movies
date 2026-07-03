import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, X, Bot, Play, Compass, Film, MessageCircle, RefreshCw } from 'lucide-react';
import { ChatMessage, Movie } from '../types';

interface AiAssistantProps {
  movies: Movie[];
  onOpenMovieDetail: (movie: Movie) => void;
  onClose: () => void;
}

const CONVERSATION_STARTERS = [
  "Suggest a funny, lighthearted movie for a family night.",
  "Give me something action-packed with deep futuristic sci-fi.",
  "Show me an emotional masterpiece that is highly rated.",
  "I want to watch a spine-chilling spooky horror movie."
];

export default function AiAssistant({ movies, onOpenMovieDetail, onClose }: AiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your Kwatch AI Movie Curator. I have full knowledge of our cinematic catalog. You can ask me to find movies by mood, specific themes, or ask conversational questions!",
      timestamp: "Just now"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggested tags selector
  const handleStarterClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const userQuery = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userQuery, history: messages })
      });

      if (!response.ok) {
        throw new Error("Chat api failed");
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: data.text || "I found some incredible options for you.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // If server returned recommended movie IDs, we attach them as metadata
      if (data.recommendedMovieIds && Array.isArray(data.recommendedMovieIds)) {
        (aiMsg as any).movieRecommendations = data.recommendedMovieIds;
      }

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      // Fallback message
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text: "I experienced a small server connection lag. Try searching for genres like 'Sci-Fi' or 'Comedy' to look through current cinema categories!",
        timestamp: "Just now"
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-neutral-950 border-l border-neutral-800 text-white w-full max-w-md shadow-2xl relative">
      
      {/* HEADER SECTION */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-radial from-orange-500/20 to-amber-500/10 rounded-xl border border-orange-500/30 text-orange-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block">Kwatch AI Assistant</span>
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Online • Gemini Powered
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* DIALOG BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-190px)] scrollbar-thin">
        {messages.map((message) => {
          const isUser = message.sender === 'user';
          const recIds = (message as any).movieRecommendations || [];
          const matchingMovies = movies.filter(m => recIds.includes(m.id));

          return (
            <div key={message.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div className="flex items-start gap-2 max-w-[85%]">
                {!isUser && (
                  <div className="p-1.5 bg-neutral-800 rounded-lg text-orange-400 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                
                <div className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isUser 
                    ? 'bg-orange-600 text-white rounded-br-xs' 
                    : 'bg-neutral-900 text-neutral-200 rounded-bl-xs border border-neutral-800'
                }`}>
                  <p>{message.text}</p>

                  {/* EMBEDDED MOVIE RECOMMENDED CARDS */}
                  {matchingMovies.length > 0 && (
                    <div className="mt-3.5 pt-3.5 border-t border-neutral-800/60 space-y-2.5">
                      <span className="text-[10px] font-bold text-orange-400 flex items-center gap-1 uppercase tracking-wider">
                        <Film className="w-3 h-3" /> Catalog Recommendations
                      </span>
                      <div className="grid grid-cols-1 gap-2.5">
                        {matchingMovies.map((movie) => (
                          <div 
                            key={movie.id}
                            onClick={() => onOpenMovieDetail(movie)}
                            className="flex items-center gap-2.5 p-2 bg-neutral-950 border border-neutral-800 hover:border-orange-500/40 rounded-xl transition-all hover:scale-[1.01] cursor-pointer text-left"
                          >
                            <img 
                              src={movie.posterUrl} 
                              alt={movie.title} 
                              className="w-10 h-14 object-cover rounded-lg border border-neutral-800 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-xs text-white block truncate">{movie.title}</span>
                              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                                <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded uppercase font-bold">{movie.type}</span>
                                <span>★ {movie.rating}</span>
                              </div>
                            </div>
                            <Play className="w-4 h-4 text-orange-400 mr-1.5 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[9px] text-neutral-500 mt-1 ml-7 mr-2">{message.timestamp}</span>
            </div>
          );
        })}

        {/* LOADING TYPING INDICATOR */}
        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-neutral-800 rounded-lg text-orange-400">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-neutral-900 border border-neutral-800 text-neutral-400 px-4 py-2.5 rounded-2xl text-xs rounded-bl-xs flex items-center gap-1.5">
              <span>Looking through Kwatch archives</span>
              <RefreshCw className="w-3 h-3 text-orange-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={scrollRef}></div>
      </div>

      {/* DIALOG FOOTER INPUT */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-900/40">
        
        {/* QUICK SUGGESTIONS CAROUSEL */}
        <div className="mb-3.5">
          <span className="text-[10px] text-neutral-500 block mb-1.5 uppercase font-semibold">Mood recommendations finder</span>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CONVERSATION_STARTERS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleStarterClick(s)}
                className="flex-shrink-0 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-full text-[10px] sm:text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                {idx === 0 && "😂 Family Fun"}
                {idx === 1 && "🚀 Cyber Sci-Fi"}
                {idx === 2 && "🎬 Top Drama"}
                {idx === 3 && "🧟 Spooky Horror"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            required
            placeholder="Type your mood (e.g. funny action movies)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 py-3 pl-4 pr-12 rounded-xl focus:outline-none focus:border-orange-500 text-xs sm:text-sm transition-colors text-neutral-100 placeholder-neutral-500"
          />
          <button
            type="submit"
            className="absolute right-2 p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
