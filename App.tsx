
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, GroundingSource } from './types';
import { gemini } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import { SUGGESTIONS } from './constants';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string, data: string, mimeType: string } | null>(null);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setSelectedImage({
          url: URL.createObjectURL(file),
          data: base64,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedImage(null);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 2000);
  };

  const handleSend = useCallback(async (text: string) => {
    if ((!text.trim() && !selectedImage) || isLoading) return;

    const currentImage = selectedImage;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      imageUrl: currentImage?.url
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    const initialAssistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, initialAssistantMessage]);

    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user' as 'model' | 'user',
        parts: [{ text: m.content }]
      }));

      let fullContent = '';
      let detectedSources: GroundingSource[] = [];
      const imagePart = currentImage ? { mimeType: currentImage.mimeType, data: currentImage.data } : undefined;
      
      const stream = gemini.streamChat(text || "Help me understand this image.", history, imagePart);

      for await (const chunk of stream) {
        if (chunk) {
          fullContent += chunk.text || '';
          if (chunk.groundingMetadata?.groundingChunks) {
            const chunks = chunk.groundingMetadata.groundingChunks;
            const sources: GroundingSource[] = chunks
              .filter((c: any) => c.web)
              .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
            if (sources.length > 0) detectedSources = sources;
          }

          setMessages(prev => 
            prev.map(m => m.id === assistantId ? { 
              ...m, 
              content: fullContent,
              sources: detectedSources.length > 0 ? detectedSources : m.sources
            } : m)
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => 
        prev.map(m => m.id === assistantId ? { ...m, content: "I encountered an error. Please direct account actions to support." } : m)
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, selectedImage]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Enhanced Sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-r border-gray-100 p-8 overflow-y-auto">
        <div className="flex items-center space-x-3 mb-12">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <span className="text-white text-xl font-bold">Q</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">QuickGrocery</h1>
        </div>
        
        <div className="space-y-8">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">System Status</h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold text-slate-700">AI Assistant Online</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Monitoring platform logistics and delivery workflows in real-time.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Help Topics</h3>
            <nav className="space-y-2">
              {['Order Flow', 'Substitutions', 'Refund Policy', 'Delivery Fees'].map((topic) => (
                <button 
                  key={topic}
                  onClick={() => handleSend(`Tell me about ${topic}`)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center justify-between group"
                >
                  {topic}
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="pt-8">
            <button 
              onClick={clearChat}
              className="w-full py-4 px-6 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
            >
              <span>Reset Conversation</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-black text-slate-900">Support Explainer</h2>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Session</span>
            </div>
          </div>
          
          <button 
            onClick={copyLink}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center space-x-2 ${showCopyFeedback ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span>{showCopyFeedback ? 'Link Copied!' : 'Share Access'}</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
          <div className="max-w-3xl mx-auto w-full">
            {messages.length === 0 && (
              <div className="space-y-12 py-8 animate-in fade-in duration-700">
                {/* Visual Process Flow */}
                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 text-center">How It Works</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { icon: '🛒', label: 'Order' },
                      { icon: '🧺', label: 'Picking' },
                      { icon: '🚛', label: 'Transit' },
                      { icon: '🏠', label: 'Delivered' }
                    ].map((step, i) => (
                      <div key={i} className="flex flex-col items-center space-y-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${i === 0 ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-100 text-slate-400'}`}>
                          {step.icon}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50">
                  <h3 className="text-2xl font-black text-slate-900 mb-4">Hello! I'm your process guide.</h3>
                  <p className="text-slate-600 leading-relaxed mb-8">
                    Need help understanding how QuickGrocery handles your orders? I can explain our quality checks, how we pick fresh items, and what happens during delivery.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SUGGESTIONS.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s.prompt)}
                        className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all text-left group"
                      >
                        <div className="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all">{s.icon}</div>
                        <h4 className="font-bold text-slate-900 mb-1">{s.title}</h4>
                        <p className="text-xs text-slate-500">{s.prompt}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
            </div>
            <div ref={messagesEndRef} className="h-20" />
          </div>
        </main>

        {/* Input Dock */}
        <div className="p-6 md:p-10 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent">
          <div className="max-w-3xl mx-auto relative">
            {selectedImage && (
              <div className="absolute bottom-full mb-4 left-4 animate-in slide-in-from-bottom-2">
                <div className="relative group">
                  <img src={selectedImage.url} alt="Selected" className="h-24 w-24 object-cover rounded-2xl border-4 border-white shadow-2xl" />
                  <button 
                    onClick={() => setSelectedImage(null)} 
                    className="absolute -top-3 -right-3 bg-slate-900 text-white rounded-full p-1.5 shadow-lg hover:bg-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" /></svg>
                  </button>
                </div>
              </div>
            )}
            
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
              className="flex items-center bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all p-2"
            >
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about delivery, packing, or items..."
                className="flex-1 bg-transparent py-4 px-4 text-slate-800 outline-none placeholder-slate-400 font-semibold"
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className={`px-8 py-4 rounded-2xl font-black text-sm tracking-wider uppercase transition-all flex items-center space-x-2 ${isLoading || (!input.trim() && !selectedImage) ? 'bg-slate-100 text-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-95'}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Send</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </>
                )}
              </button>
            </form>
            
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
