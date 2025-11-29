import React, { useState, useRef, useEffect } from 'react';
import { LawArticle, ChatMessage } from '../types';
import { directQuery } from '../services/apiService';
import { Send, Bot, User, Sparkles, Scale } from 'lucide-react';

interface LegalAssistantProps {
  laws: LawArticle[];
  onSelectLaw: (law: LawArticle) => void;
}

export const LegalAssistant: React.FC<LegalAssistantProps> = ({ laws, onSelectLaw }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis l\'assistant juridique LexOrigin. Je peux vous aider à comprendre les lois canadiennes sur l\'immigration et la citoyenneté. Que souhaitez-vous savoir ?' }
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
      const response = await directQuery(userMsg);
      
      let assistantMessage = response.answer;
      
      // Add confidence indicator
      if (response.confidence < 0.5) {
        assistantMessage += '\n\n⚠️ Cette réponse est basée sur un contexte limité. Veuillez vérifier les sources officielles.';
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Je n'ai pas pu accéder à la base de données juridique. Veuillez vérifier que le serveur API est en cours d'exécution." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Function to parse text and replace [ID] with clickable buttons
  const renderMessageContent = (content: string) => {
    // Also match section references like "Section 36 of IRPA" or "IRPA-36"
    const parts = content.split(/(\[[A-Z0-9-]+\]|(?:Section|Article|§)\s*\d+(?:\.\d+)?(?:\s*(?:of|de)\s*(?:IRPA|IRPR|CA|CR))?)/gi);
    
    return parts.map((part, idx) => {
      // Match [LAW-ID] format
      const idMatch = part.match(/^\[([A-Z0-9-]+)\]$/);
      if (idMatch) {
        const lawId = idMatch[1];
        const law = laws.find(l => l.id === lawId || l.id.includes(lawId));
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
      
      // Match "Section X of IRPA" format
      const sectionMatch = part.match(/(?:Section|Article|§)\s*(\d+(?:\.\d+)?)\s*(?:(?:of|de)\s*(IRPA|IRPR|CA|CR))?/i);
      if (sectionMatch) {
        const section = sectionMatch[1];
        const lawCode = sectionMatch[2]?.toUpperCase() || 'IRPA';
        const searchId = `${lawCode}-${section}`;
        const law = laws.find(l => l.id === searchId || l.id.startsWith(searchId));
        if (law) {
          return (
            <button 
              key={idx}
              onClick={() => onSelectLaw(law)}
              className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-amber-900/30 border border-amber-500/30 text-amber-300 text-xs hover:bg-amber-500 hover:text-white transition-colors align-baseline"
            >
              <Scale className="w-3 h-3" />
              {part}
            </button>
          );
        }
      }
      
      return <span key={idx}>{part}</span>;
    });
  };

  const suggestedQuestions = [
    "Qu'est-ce que l'interdiction de territoire ?",
    "Comment fonctionne le parrainage familial ?",
    "Quelles sont les conditions pour la citoyenneté ?",
    "Expliquez la Section 36 de l'IRPA"
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm shrink-0">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          Assistant IA
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-indigo-900/50 text-indigo-400' : 'bg-slate-700 text-slate-300'}`}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-slate-800 text-slate-100 rounded-tr-sm' 
                : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-sm'
            }`}>
              <div className="whitespace-pre-line">
                {renderMessageContent(msg.content)}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded bg-indigo-900/50 text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        
        {/* Suggested questions for first message */}
        {messages.length === 1 && (
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-2">Questions suggérées:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(q)}
                  className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded border border-slate-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-900/30 shrink-0">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg py-2 pl-3 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            placeholder="Posez une question sur l'immigration..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-600 mt-2">
          Propulsé par Ollama + RAG. Vérifiez les sources officielles.
        </p>
      </div>
    </div>
  );
};
