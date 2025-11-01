import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Bot, User, Sparkles } from 'lucide-react';
import { findIntent, getInitialGreeting } from './intents';
import { saveUnknownQuery, shouldSaveAsUnknown } from './unknowns';
import PromotionsAIResponse from './PromotionsAIResponse';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isInitial?: boolean;
}

interface AcaiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const AcaiChatbot: React.FC<AcaiChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getInitialGreeting();
      setMessages([{
        id: '1',
        text: greeting,
        isBot: true,
        timestamp: new Date(),
        isInitial: true
      }]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const message = inputText.trim();
    if (!message) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find intent and generate response
    const intent = findIntent(message);
    let responseText = typeof intent.response === 'function' ? intent.response() : intent.response;

    // Save unknown queries for improvement
    if (shouldSaveAsUnknown(message, intent.id, 0.5)) {
      saveUnknownQuery(message, 'chatbot-conversation');
    }

    // Add bot response
    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: responseText,
      isBot: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const quickActions = [
    { text: 'Ver cardápio', emoji: '🍧' },
    { text: 'Promoções de hoje', emoji: '🔥' },
    { text: 'Horários de funcionamento', emoji: '🕐' },
    { text: 'Formas de pagamento', emoji: '💳' },
    { text: 'Fazer pedido', emoji: '🛒' },
    { text: 'Acompanhar pedido', emoji: '📦' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-green-500 p-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Assistente Virtual</h2>
                <p className="text-white/80 text-sm">Elite Açaí</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.isBot
                    ? 'bg-white text-gray-800 shadow-sm border border-gray-100'
                    : 'bg-gradient-to-r from-purple-600 to-green-500 text-white'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {message.isBot ? (
                    <Bot size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <User size={16} className="text-white/80 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${
                    message.isBot ? 'text-purple-600' : 'text-white/80'
                  }`}>
                    {message.isBot ? 'Assistente' : 'Você'}
                  </span>
                  <span className={`text-xs ml-auto ${
                    message.isBot ? 'text-gray-400' : 'text-white/60'
                  }`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                
                <div className="text-sm leading-relaxed whitespace-pre-line">
                  {message.text}
                </div>
                
                {/* Show promotions component for promotion-related messages */}
                {message.isBot && (message.text.includes('PROMOÇÃO') || message.text.includes('QUINTA ELITE')) && (
                  <div className="mt-3">
                    <PromotionsAIResponse />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-purple-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="p-4 border-t border-gray-200 bg-white">
            <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-500" />
              Perguntas rápidas:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputText(action.text);
                    setTimeout(() => {
                      handleSendMessage(new Event('submit') as any);
                    }, 100);
                  }}
                  className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <span className="mr-2">{action.emoji}</span>
                  {action.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite sua pergunta..."
              className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-300 text-white p-3 rounded-xl transition-all duration-300 flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcaiChatbot;