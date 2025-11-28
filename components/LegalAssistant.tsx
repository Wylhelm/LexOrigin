import React, { useState, useRef, useEffect } from 'react';
import { LawArticle, ChatMessage } from '../types';
import { askLegalAssistant } from '../services/geminiService';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface LegalAssistantProps {
  laws: LawArticle[];
  onSelectLaw: (law: LawArticle) => void;
}

export const LegalAssistant: React.FC<LegalAssistantProps> = ({ laws, onSelectLaw }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello. I am the LexOrigin Assistant. I can help you find laws or explain rules in the Criminal Code. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await askLegalAssistant(userMsg, laws);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error accessing the legal database." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Function to parse text and replace [ID] with clickable buttons
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\[[A-Z0-9-]+\])/g);
    
    return parts.map((part, idx) => {
      const match = part.match(/^\[([A-Z0-9-]+)\]$/);
      if (match) {
        const lawId = match[1];
        const law = laws.find(l => l.id === lawId);
        if (law) {
          return (
            <button 
              key={idx}
              onClick={() => onSelectLaw(law)}
              className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-xs font-mono hover:bg-indigo-500 hover:text-white transition-colors align-baseline"
            >
              <Sparkles className="w-3 h-3" />
              {lawId}
            </button>
          );
        }
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
       <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <h2 className="text-lg font-serif font-medium text-slate-200 flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          Legal Assistant
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-indigo-900/50 text-indigo-400' : 'bg-slate-700 text-slate-300'}`}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-slate-800 text-slate-100 rounded-tr-sm' 
                : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-sm'
            }`}>
              <p className="whitespace-pre-line">
                {renderMessageContent(msg.content)}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex gap-3">
             <div className="w-8 h-8 rounded bg-indigo-900/50 text-indigo-400 flex items-center justify-center shrink-0">
               <Bot className="w-4 h-4" />
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-full py-2.5 pl-4 pr-12 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            placeholder="Ask a legal question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-full transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-600 mt-2">
          AI generated. Check source laws for accuracy.
        </p>
      </div>
    </div>
  );
};