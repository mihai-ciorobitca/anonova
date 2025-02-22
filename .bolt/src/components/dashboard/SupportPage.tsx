import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Users, ExternalLink, Shield, Zap, Clock, Terminal, Bot, TicketIcon, Send, X, PlayCircle } from 'lucide-react';
import Button from '../Button';
import GlitchText from '../GlitchText';
import { generateResponse } from '../../utils/supportBot';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { useOnboarding } from '../../contexts/OnboardingContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  message: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messages: ChatMessage[];
  isActive: boolean;
  lastActivity: number;
}

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds

const SupportPage = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [inactivityTimers, setInactivityTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setShowOnboarding } = useOnboarding();

  const { credits, hasUsedFreeCredits } = useUser();
  const userContext = {
    credits,
    hasUsedFreeCredits,
    plan: 'free'
  };

  const supportId = 'ANV-24031501';
  const discordUrl = 'https://discord.gg/your-discord-invite';

  const supportFeatures = [
    {
      icon: Bot,
      title: 'AI Support',
      description: 'Get instant answers from our AI chatbot'
    },
    {
      icon: TicketIcon,
      title: 'Support Tickets',
      description: 'Create tickets for complex issues'
    },
    {
      icon: Users,
      title: 'Community Help',
      description: 'Connect with other users'
    }
  ];

  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions);
      const updatedSessions = sessions.map((session: ChatSession) => ({
        ...session,
        isActive: false,
        lastActivity: session.timestamp
      }));
      setChatSessions(updatedSessions);
    }
  }, []);

  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages]);

  useEffect(() => {
    return () => {
      Object.values(inactivityTimers).forEach(timer => clearTimeout(timer));
    };
  }, [inactivityTimers]);

  const startInactivityTimer = (sessionId: string) => {
    if (inactivityTimers[sessionId]) {
      clearTimeout(inactivityTimers[sessionId]);
    }

    const timer = setTimeout(() => {
      setChatSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, isActive: false }
          : session
      ));
    }, INACTIVITY_TIMEOUT);

    setInactivityTimers(prev => ({
      ...prev,
      [sessionId]: timer
    }));
  };

  const handleCloseChatbot = () => {
    if (currentSession) {
      setChatSessions(prev => prev.map(session => 
        session.id === currentSession.id 
          ? { ...session, isActive: false }
          : session
      ));
      
      if (inactivityTimers[currentSession.id]) {
        clearTimeout(inactivityTimers[currentSession.id]);
        setInactivityTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[currentSession.id];
          return newTimers;
        });
      }
    }
    
    setShowChatbot(false);
    setCurrentSession(null);
    setChatMessage('');
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      lastMessage: 'Hello! I\'m your AI support assistant. How can I help you today?',
      timestamp: Date.now(),
      isActive: true,
      lastActivity: Date.now(),
      messages: [
        {
          id: Date.now().toString(),
          role: 'bot',
          message: 'Hello! I\'m your AI support assistant. How can I help you today?',
          timestamp: Date.now()
        }
      ]
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    setShowChatbot(true);
    startInactivityTimer(newSession.id);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !currentSession || !currentSession.isActive) return;

    const now = Date.now();
    const updatedSession = {
      ...currentSession,
      lastActivity: now,
      lastMessage: chatMessage,
      timestamp: now,
      messages: [...currentSession.messages, {
        id: now.toString(),
        role: 'user',
        message: chatMessage,
        timestamp: now
      }]
    };

    setChatSessions(prev => 
      prev.map(session => 
        session.id === currentSession.id ? updatedSession : session
      )
    );
    setCurrentSession(updatedSession);
    setChatMessage('');
    setIsTyping(true);
    startInactivityTimer(currentSession.id);

    const response = generateResponse(chatMessage, userContext);

    let currentResponse = '';
    const words = response.split(' ');
    
    const typingInterval = setInterval(() => {
      if (words.length === 0) {
        clearInterval(typingInterval);
        setIsTyping(false);

        const botMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'bot',
          message: currentResponse,
          timestamp: Date.now()
        };

        const finalSession = {
          ...updatedSession,
          lastMessage: currentResponse,
          timestamp: Date.now(),
          messages: [...updatedSession.messages, botMessage]
        };

        setChatSessions(prev => 
          prev.map(session => 
            session.id === currentSession.id ? finalSession : session
          )
        );
        setCurrentSession(finalSession);
        return;
      }
      
      currentResponse += (currentResponse ? ' ' : '') + words.shift();
    }, 50);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const createSupportTicket = () => {
    window.open(discordUrl + '/create-ticket', '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <GlitchText 
            text="Support Center"
            className="text-4xl font-bold"
          />
          <Button
            className="flex items-center gap-2"
            onClick={() => setShowOnboarding(true)}
          >
            <PlayCircle className="w-5 h-5" />
            Watch Tutorial
          </Button>
        </div>
        <p className="text-gray-400">Get help from our AI assistant, create support tickets, or join our community</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <div className="text-center mb-8">
            <Terminal className="w-16 h-16 text-[#0F0] mx-auto mb-4 animate-[float_4s_ease-in-out_infinite]" />
            <h3 className="text-2xl font-bold text-[#0F0] mb-2">Get Support</h3>
            <p className="text-gray-400">
              Choose your preferred support method
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-4 border border-[#0F0]/20 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Your Support ID</div>
              <div className="font-mono text-lg text-[#0F0]">{supportId}</div>
              <div className="text-sm text-gray-400 mt-1">
                Include this ID in support requests
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                className="w-full flex items-center justify-center gap-2 py-4"
                onClick={() => setShowChatbot(true)}
              >
                <Bot className="w-5 h-5" />
                <div className="flex flex-col items-start">
                  <span>AI Support</span>
                  <span className="text-xs opacity-80">Available 24/7</span>
                </div>
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="secondary"
                  className="flex flex-col items-center justify-center gap-1 py-4"
                  onClick={createSupportTicket}
                >
                  <TicketIcon className="w-5 h-5" />
                  <span>Create Ticket</span>
                </Button>

                <a 
                  href={discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button 
                    variant="secondary"
                    className="w-full flex flex-col items-center justify-center gap-1 py-4"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Join Discord</span>
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-[#0F0] mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Support Hours
          </h3>
          <div className="space-y-6">
            <div className="p-4 border border-[#0F0]/20 rounded-lg">
              <div className="text-lg font-bold text-[#0F0] mb-2">
                5:00 AM - 5:00 PM PST
              </div>
              <div className="text-gray-400">
                Monday through Friday
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Our support team is available to assist you during these hours. 
                For off-hours support, use our AI chatbot or leave a message in Discord.
              </div>
            </div>

            <div className="p-4 border border-[#0F0]/20 rounded-lg">
              <div className="text-sm font-semibold mb-2">Support Options</div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#0F0]" />
                  <span className="text-[#0F0]">AI Support - 24/7 Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <TicketIcon className="w-4 h-4 text-[#0F0]" />
                  <span className="text-[#0F0]">Discord Tickets - During Support Hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {supportFeatures.map((feature, index) => (
          <div 
            key={index}
            className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6 hover:border-[#0F0]/50 transition-all group"
          >
            <feature.icon className="w-8 h-8 text-[#0F0] mb-4 transform group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold text-[#0F0] mb-2">{feature.title}</h4>
            <p className="text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Chatbot Modal */}
      {showChatbot && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleCloseChatbot}
          />
          
          <div className="relative bg-black/90 border border-[#0F0]/30 rounded-xl w-full max-w-5xl mx-4 h-[600px] flex">
            <div className="w-64 border-r border-[#0F0]/20 flex flex-col">
              <div className="p-4 border-b border-[#0F0]/20">
                <Button
                  className="w-full"
                  onClick={createNewSession}
                >
                  New Chat
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {chatSessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => setCurrentSession(session)}
                    className={`w-full p-4 text-left hover:bg-[#0F0]/10 transition-colors ${
                      currentSession?.id === session.id ? 'bg-[#0F0]/10' : ''
                    }`}
                  >
                    <div className="font-semibold mb-1 truncate">
                      {session.title}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {session.lastMessage}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(session.timestamp)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-[#0F0]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#0F0]" />
                  <h3 className="text-lg font-bold text-[#0F0]">AI Support Assistant</h3>
                </div>
                <button
                  onClick={handleCloseChatbot}
                  className="text-gray-400 hover:text-[#0F0] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentSession?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-[#0F0]/10 text-[#0F0]'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      {msg.message}
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                {!currentSession?.isActive && (
                  <div className="text-center py-4">
                    <p className="text-gray-400">This chat is no longer active. Please start a new chat.</p>
                  </div>
                )}
                {isTyping && currentSession?.isActive && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 text-white p-3 rounded-lg">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#0F0]/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#0F0]/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#0F0]/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-[#0F0]/20">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={currentSession?.isActive ? "Type your message..." : "Start a new chat to send messages"}
                    disabled={!currentSession?.isActive}
                    className="flex-1 bg-black/50 border border-[#0F0]/30 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || !currentSession?.isActive}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
