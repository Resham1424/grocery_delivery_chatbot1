
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  const formatContent = (content: string) => {
    if (!content) return null;
    return content.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        return <li key={i} className="ml-4 list-disc mb-1">{trimmedLine.substring(2)}</li>;
      }
      if (trimmedLine.match(/^\d+\./)) {
        return <li key={i} className="ml-4 list-decimal mb-1">{trimmedLine.replace(/^\d+\.\s*/, '')}</li>;
      }
      const bolded = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      return <p key={i} className="min-h-[1em] mb-2 last:mb-0">{bolded}</p>;
    });
  };

  return (
    <div className={`flex w-full mb-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-xl shadow-sm bg-white border border-gray-100`}>
          {isAssistant ? '🤖' : '👤'}
        </div>
        <div className={`mx-2 flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
          <div className={`px-4 py-3 rounded-xl shadow-sm text-sm leading-relaxed
            ${isAssistant 
              ? 'bg-white border border-gray-200 text-gray-800' 
              : 'bg-[#10b981] text-white'}`}>
            
            {message.imageUrl && (
              <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                <img 
                  src={message.imageUrl} 
                  alt={message.isGeneratedImage ? "Generated preview" : "Uploaded item"} 
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            )}

            <div className="whitespace-pre-wrap">
              {formatContent(message.content)}
            </div>
            
            {isAssistant && message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sources</p>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-gray-50 hover:bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-gray-200 transition-colors inline-block max-w-[150px] truncate"
                    >
                      {source.title || new URL(source.uri).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
