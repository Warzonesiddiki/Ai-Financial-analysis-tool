import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { XIcon, SendIcon, SparklesIcon } from './icons';
import { Spinner } from './Spinner';

interface AIChatProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

export const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
        const isUser = message.role === 'user';
        const avatarText = isUser ? 'You' : 'AI';
        const avatarClass = isUser ? 'user' : 'model';
        const bubbleClass = isUser ? 'user' : 'model';

        // Simple markdown for bolding
        const renderContent = (content: string) => {
            return content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return part;
            });
        };

        return (
            <div className={`chat-message ${message.role}`}>
                <div className={`chat-avatar ${avatarClass}`}>{avatarText}</div>
                <div className={`chat-bubble ${bubbleClass}`}>
                   {renderContent(message.content)}
                </div>
            </div>
        );
    }
    
    return (
        <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
            <div className="chat-header">
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <SparklesIcon style={{color: 'var(--color-primary)'}} />
                    <h3 style={{margin: 0, fontSize: '1.25rem'}}>AI Analyst</h3>
                </div>
                <button onClick={onClose} className="button button-tertiary" style={{padding: '0.5rem'}}>
                    <XIcon />
                </button>
            </div>
            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-message model">
                         <div className="chat-avatar model">AI</div>
                         <div className="chat-bubble model">
                            I've reviewed this section of the report. Ask me anything to dive deeper.
                         </div>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <MessageBubble key={index} message={msg} />
                ))}
                {isLoading && (
                    <div className="chat-message model">
                         <div className="chat-avatar model">AI</div>
                         <div className="chat-bubble model" style={{display:'flex', alignItems: 'center', gap: '8px'}}>
                            <Spinner /> Thinking...
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    className="input"
                    placeholder="Ask a follow-up question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                />
                <button type="submit" className="button button-primary" disabled={isLoading || !input.trim()}>
                    <SendIcon />
                </button>
            </form>
        </div>
    );
};
