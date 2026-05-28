import React, { useState, useEffect, useRef } from 'react';
import { Send, User, X, MessageCircle, CheckCheck, Terminal, Lock } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { db } from '../../Utils/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';

const FloatingChat = ({ isDark, onOpenTerminal, onOpenVault }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [visitor, setVisitor] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatId, setChatId] = useState(null);
    const messagesEndRef = useRef(null);

    // Persist visitor session
    useEffect(() => {
        const savedSession = localStorage.getItem('portfolio_chat_session');
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                setVisitor({ name: parsed.name, email: parsed.email });
                setName(parsed.name);
                setEmail(parsed.email);
                setChatId(parsed.id);
            } catch (e) {
                console.error("Failed to parse session", e);
            }
        }
    }, []);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (!chatId || !db) return;

        const q = query(collection(db, 'contact_chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [chatId]);

    const handleStartChat = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;

        const id = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
        setChatId(id);

        try {
            await setDoc(doc(db, 'contact_chats', id), {
                visitorName: name,
                visitorEmail: email,
                lastActive: serverTimestamp(),
                unreadCount: 0
            }, { merge: true });
        } catch (error) {
            console.error("Error starting chat:", error);
        }

        setVisitor({ name, email });
        localStorage.setItem('portfolio_chat_session', JSON.stringify({ name, email, id }));
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatId || !db) return;

        const text = newMessage;
        setNewMessage('');

        // Optimistic UI update for instant rendering
        const tempId = Date.now().toString();
        setMessages(prev => [...prev, { id: tempId, text: text, sender: 'visitor', timestamp: null }]);

        try {
            // 1. Save message to chat history
            await addDoc(collection(db, 'contact_chats', chatId, 'messages'), {
                text: text,
                sender: 'visitor',
                timestamp: serverTimestamp()
            });

            // 2. Update parent chat document
            await setDoc(doc(db, 'contact_chats', chatId), {
                lastMessage: text,
                lastActive: serverTimestamp(),
                unreadCount: 1
            }, { merge: true });

            // 3. Trigger Email to Aman using EmailJS (Free Tier)
            if (import.meta.env.VITE_EMAILJS_SERVICE_ID) {
                try {
                    const res = await emailjs.send(
                        import.meta.env.VITE_EMAILJS_SERVICE_ID,
                        import.meta.env.VITE_EMAILJS_TEMPLATE_ID_TO_AMAN,
                        {
                            from_name: visitor.name,
                            from_email: visitor.email,
                            message: text,
                            reply_to: visitor.email,
                        },
                        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
                    );
                    console.log("EmailJS Success (to Aman):", res.status, res.text);
                } catch (err) {
                    console.error("EmailJS Error (to Aman):", err);
                }
            } else {
                console.warn("EmailJS credentials not configured yet. Check .env file.");
            }

        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date();
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className={`mb-4 w-80 sm:w-96 h-[500px] flex flex-col rounded-sm overflow-hidden shadow-2xl border transition-all origin-bottom-right animate-in zoom-in-95 duration-200 font-mono ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-gray-200 bg-white'}`}>

                    {/* Header */}
                    <div className={`flex items-center justify-between px-4 py-3 z-10 shadow-sm ${isDark ? 'bg-black border-b border-zinc-800' : 'bg-gray-100 border-b border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex items-center justify-center border rounded-md overflow-hidden ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-300'}`}>
                                <img src="https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=Aman" alt="Aman" className="w-full h-full object-cover p-1" />
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>Aman Anubhav</h3>
                                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Typically replies instantly</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-zinc-500'}`}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    {!visitor ? (
                        <div className={`flex-1 flex flex-col p-6 overflow-y-auto ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                            <div className="text-center mb-8 mt-6">
                                <h2 className={`text-xl uppercase tracking-widest font-black mb-3 ${isDark ? 'text-white' : 'text-zinc-800'}`}>HELLO THERE! 👋</h2>
                                <p className={`text-xs uppercase tracking-wider leading-relaxed font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                    PLEASE ENTER YOUR DETAILS<br />TO START CHATTING WITH ME.
                                </p>
                            </div>
                            <form onSubmit={handleStartChat} className="space-y-4 mt-auto">
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors text-sm ${isDark ? 'bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white' : 'bg-gray-50 border-gray-200 focus:border-zinc-400'}`}
                                />
                                <input
                                    type="email"
                                    placeholder="Your Email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors text-sm ${isDark ? 'bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white' : 'bg-gray-50 border-gray-200 focus:border-zinc-400'}`}
                                />
                                <button
                                    type="submit"
                                    className={`w-full font-bold py-3 border transition-colors text-xs ${isDark ? 'bg-zinc-100 border-zinc-100 text-black hover:bg-white hover:border-white' : 'bg-zinc-900 border-zinc-900 text-white hover:bg-black hover:border-black'}`}
                                >
                                    Start Chat
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col relative">
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3"
                                style={{ backgroundColor: isDark ? '#09090b' : '#fafafa' }}>

                                <div className="flex justify-start">
                                    <div className={`max-w-[85%] p-3 border relative shadow-sm ${isDark ? 'bg-zinc-900/50 text-zinc-300 border-zinc-800' : 'bg-white text-zinc-800 border-gray-200'}`}>
                                        <p className="text-xs leading-relaxed">Hi {visitor.name}! I'm glad you're here. Drop your message and I'll get back to you at earliest!

                                            <br />
                                            <br />

                                            You'll be informed about my reply though email notification, sit back and have your coffee.</p>
                                        <span className={`text-[9px] float-right mt-2 ml-3 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Auto-reply</span>
                                    </div>
                                </div>

                                {messages.map((msg, idx) => (
                                    <div key={msg.id || idx} className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 border relative shadow-sm
                                            ${msg.sender === 'visitor'
                                                ? (isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-100 border-gray-300 text-black')
                                                : (isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300' : 'bg-white border-gray-200 text-zinc-800')}`}>
                                            <p className="text-xs leading-relaxed">{msg.text}</p>
                                            <div className={`text-[9px] flex items-center justify-end gap-1 mt-2 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                                                {formatTime(msg.timestamp)}
                                                {msg.sender === 'visitor' && <CheckCheck size={12} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className={`px-3 py-3 flex items-center gap-2 ${isDark ? 'bg-zinc-900 border-t border-zinc-800' : 'bg-white border-t border-gray-200'}`}>
                                <button
                                    onClick={() => { setIsOpen(false); onOpenTerminal(); }}
                                    className={`p-2 rounded-full transition-colors ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-black hover:bg-gray-100'}`}
                                    title="Open Terminal"
                                >
                                    <Terminal size={18} />
                                </button>
                                <button
                                    onClick={() => { setIsOpen(false); onOpenVault(); }}
                                    className={`p-2 rounded-full transition-colors ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-black hover:bg-gray-100'}`}
                                    title="Open Secure Contact"
                                >
                                    <Lock size={18} />
                                </button>
                                <form onSubmit={handleSendMessage} className="flex-1 flex gap-2 ml-1">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className={`flex-1 px-4 py-2 text-xs outline-none transition-colors border ${isDark ? 'bg-black text-white placeholder-zinc-600 border-zinc-800 focus:border-zinc-500' : 'bg-gray-50 text-black placeholder-zinc-400 border-gray-200 focus:border-zinc-400'}`}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className={`w-10 h-10 flex items-center justify-center transition-colors border shadow-sm ${newMessage.trim() ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black') : (isDark ? 'bg-black text-zinc-700 border-zinc-800' : 'bg-gray-50 text-zinc-300 border-gray-200')} `}
                                    >
                                        <Send size={18} className={newMessage.trim() ? 'mr-0.5 mt-0.5' : ''} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-xl shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-zinc-100 text-black hover:bg-white' : 'bg-zinc-900 text-white hover:bg-black'}`}
            >
                {isOpen ? <X size={24} /> : <Send size={24} className="-ml-1 mt-1" />}
            </button>
        </div>
    );
};

export default FloatingChat;
