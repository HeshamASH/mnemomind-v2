import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Source, ModelId, DataSource, Attachment, MessageRole, GroundingOptions } from '../types';
import Message from './Message';
import ModelSwitcher from './ModelSwitcher';
import AttachmentPreview from './AttachmentPreview';
import ToolsPopover from './ToolsPopover';
import { blobToBase64 } from '../utils/fileUtils';
import ErrorBoundary from './ErrorBoundary';

// --- Welcome Block Data ---
const WelcomeBlock: React.FC<{
  onConnectDataSource: () => void;
}> = ({ onConnectDataSource }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="max-w-xl">
                <div className="mx-auto bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl inline-block mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                    </svg>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to MnemoMind</h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
                   Connect a data source to begin asking questions about your code, documents, and more.
                </p>
                <button
                    onClick={onConnectDataSource}
                    className="bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-cyan-500 transition-colors duration-200"
                >
                    Connect Data Source
                </button>
            </div>
        </div>
    );
};


// --- Icons ---
const SendIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);

const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
);

const ToolsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
);

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className || ''}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 0 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
);

const ShrinkIcon: React.FC<{ onClick: () => void; }> = ({ onClick }) => (
    <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
        <path fillRule="evenodd" d="M12.79 7.21a.75.75 0 0 1 .02-1.06l3.25-3.25a.75.75 0 0 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06-.02ZM7.21 12.79a.75.75 0 0 1-1.06.02l-3.25-3.25a.75.75 0 1 1 1.06-1.06l3.25 3.25a.75.75 0 0 1 .02 1.06Zm5.58 1.06a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 0 1 1.06-1.06l3.25 3.25a.75.75 0 0 1 0 1.06ZM2.94 17.06a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
    </svg>
);


// --- Main Chat Interface ---

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (query: string, attachment?: Attachment) => void;
  onSelectSource: (source: Source) => void;
  onSuggestionAction: (messageIndex: number, action: 'accepted' | 'rejected') => void;
  onExportToSheets: (tableData: (string | null)[][]) => void;
  selectedModel: ModelId;
  onModelChange: (modelId: ModelId) => void;
  activeDataSource: DataSource | undefined | null;
  onConnectDataSource: () => void;
  isCodeGenerationEnabled: boolean;
  onToggleCodeGeneration: () => void;
  groundingOptions?: GroundingOptions;
  onGroundingOptionsChange: (options: GroundingOptions) => void;
  apiError: string | null;
  setApiError: (error: string | null) => void;
  cloudSearchError: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSendMessage, onSelectSource, onSuggestionAction, onExportToSheets, selectedModel, onModelChange, activeDataSource, onConnectDataSource, isCodeGenerationEnabled, onToggleCodeGeneration, groundingOptions, onGroundingOptionsChange, apiError, setApiError, cloudSearchError }) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isToolsPopoverOpen, setIsToolsPopoverOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolsPopoverRef = useRef<HTMLDivElement>(null);




  const handleResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 24;
        const maxLines = 10;
        const maxHeight = lineHeight * maxLines + (textarea.offsetHeight - textarea.clientHeight);

        if (scrollHeight > maxHeight) {
            textarea.style.height = `${maxHeight}px`;
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.height = `${scrollHeight}px`;
            textarea.style.overflowY = 'hidden';
        }
        setIsExpanded(scrollHeight > lineHeight * 1.5);
    }
  }, []);

  useEffect(() => {
    handleResizeTextarea();
  }, [input, handleResizeTextarea]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => console.error('Speech recognition error:', event.error);
        recognitionRef.current = recognition;
    }
  }, []);
  
   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isToolsPopoverOpen && toolsPopoverRef.current && !toolsPopoverRef.current.contains(event.target as Node)) {
        setIsToolsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isToolsPopoverOpen]);

  const handleToggleListening = () => {
    if (isListening) {
        recognitionRef.current?.stop();
    } else {
        recognitionRef.current?.start();
        setIsListening(true);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        try {
            const base64Content = await blobToBase64(file);
            setAttachment({
                name: file.name,
                type: file.type,
                size: file.size,
                content: base64Content,
            });
        } catch (error) {
            console.error("Error processing file for attachment:", error);
        }
    }
    event.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || attachment) {
      onSendMessage(input, attachment ?? undefined);
      setInput('');
      setAttachment(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setIsExpanded(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  };

  const handleShrink = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      setIsExpanded(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && !activeDataSource ? (
            <WelcomeBlock onConnectDataSource={onConnectDataSource} />
        ) : (
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <ErrorBoundary key={index}>
                <Message message={msg} messageIndex={index} onSelectSource={onSelectSource} onSuggestionAction={(action) => onSuggestionAction(index, action)} onExportToSheets={onExportToSheets} />
              </ErrorBoundary>
            ))}
             {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
                <ErrorBoundary>
                  <Message message={{role: MessageRole.MODEL, content: ''}} onSelectSource={()=>{}} onSuggestionAction={()=>{}} onExportToSheets={onExportToSheets} />
                </ErrorBoundary>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-4 bg-white dark:bg-slate-900">
        <div className="w-full max-w-4xl mx-auto">
            {apiError && (
                <div className="relative p-3 mb-3 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm font-semibold" role="alert">
                    {apiError}
                    <button onClick={() => setApiError(null)} className="absolute top-1 right-1 p-1.5 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-full">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"></path></svg>
                    </button>
                </div>
            )}
            <div className="relative p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <form onSubmit={handleSubmit}>
                  <div className="relative">
                    {attachment && (
                        <AttachmentPreview attachment={attachment} onRemove={() => setAttachment(null)} />
                    )}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "Listening..." : "Ask Gemini"}
                        className="w-full bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none resize-none overflow-y-hidden text-base"
                        rows={1}
                        disabled={isLoading}
                    />
                    {isExpanded && (
                      <div className="absolute top-1 right-1">
                        <ShrinkIcon onClick={handleShrink} />
                      </div>
                    )}
                  </div>
                
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1" ref={toolsPopoverRef}>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg p-2 disabled:opacity-50 transition-colors"
                            aria-label="Attach file"
                        >
                            <PlusIcon />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,application/pdf"
                        />
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsToolsPopoverOpen(prev => !prev)}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg px-2 py-2 disabled:opacity-50 transition-colors"
                                aria-label="Open tools menu"
                            >
                                <ToolsIcon />
                                <span>Tools</span>
                            </button>
                            {isToolsPopoverOpen && groundingOptions && (
                                <ToolsPopover 
                                    isCodeGenerationEnabled={isCodeGenerationEnabled}
                                    onToggleCodeGeneration={onToggleCodeGeneration}
                                    groundingOptions={groundingOptions}
                                    onGroundingOptionsChange={onGroundingOptionsChange}
                                    hasPreloadedDataSource={!!activeDataSource}
                                    cloudSearchError={cloudSearchError}
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ModelSwitcher
                            selectedModel={selectedModel}
                            onModelChange={onModelChange}
                            disabled={isLoading}
                        />
                         {(input.trim() || attachment) ? (
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-cyan-600 text-white rounded-lg p-2 hover:bg-cyan-500 disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:text-slate-600 dark:disabled:text-slate-400 transition-colors"
                                aria-label="Send message"
                            >
                                <SendIcon />
                            </button>
                         ) : recognitionRef.current && (
                            <button
                                type="button"
                                onClick={handleToggleListening}
                                disabled={isLoading}
                                className="text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg p-2 disabled:opacity-50 transition-colors"
                                aria-label="Use microphone"
                            >
                                <MicIcon className={isListening ? 'text-cyan-500 animate-pulse' : ''} />
                            </button>
                        )}
                    </div>
                </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;