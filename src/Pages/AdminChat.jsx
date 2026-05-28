import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, User, CheckCheck, MoreVertical, LogOut } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { db } from '../Utils/firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';

const AdminChat = ({ isDark }) => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authInput, setAuthInput] = useState('');
    
    const messagesEndRef = useRef(null);

    // Mock authentication for prototype
    const handleLogin = (e) => {
        e.preventDefault();
        if (authInput === 'admin123') { // Simple mock password
            setIsAuthenticated(true);
        }
    };

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch all active conversations
    useEffect(() => {
        if (!isAuthenticated || !db) return;

        const q = query(collection(db, 'contact_chats'), orderBy('lastActive', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChats(chatList);
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    // Fetch messages for active chat
    useEffect(() => {
        if (!activeChat || !db) return;

        const q = query(collection(db, 'contact_chats', activeChat.id, 'messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        // Mark as read (mock implementation)
        if (activeChat.unreadCount > 0) {
            setDoc(doc(db, 'contact_chats', activeChat.id), { unreadCount: 0 }, { merge: true });
        }

        return () => unsubscribe();
    }, [activeChat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat || !db) return;

        const text = newMessage;
        setNewMessage('');

        try {
            await addDoc(collection(db, 'contact_chats', activeChat.id, 'messages'), {
                text: text,
                sender: 'admin',
                timestamp: serverTimestamp()
            });

            await setDoc(doc(db, 'contact_chats', activeChat.id), {
                lastMessage: text,
                lastActive: serverTimestamp()
            }, { merge: true });

            // Trigger Email to Visitor using EmailJS (Free Tier)
            if (import.meta.env.VITE_EMAILJS_SERVICE_ID) {
                emailjs.send(
                    import.meta.env.VITE_EMAILJS_SERVICE_ID,
                    import.meta.env.VITE_EMAILJS_TEMPLATE_ID_TO_VISITOR,
                    {
                        to_email: activeChat.visitorEmail,
                        to_name: activeChat.visitorName,
                        reply_message: text,
                    },
                    {
                        publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
                    }
                ).catch(err => console.error("EmailJS Error:", err));
            } else {
                console.warn("EmailJS credentials not configured yet.");
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

    if (!isAuthenticated) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-zinc-950 text-white' : 'bg-gray-100 text-black'}`}>
                <div className={`w-full max-w-sm p-8 rounded-2xl shadow-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
                    <h2 className="text-2xl font-bold mb-6 text-center">Admin Access</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input 
                            type="password" 
                            placeholder="Enter password (admin123)" 
                            value={authInput}
                            onChange={(e) => setAuthInput(e.target.value)}
                            className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-zinc-950 border-zinc-800 focus:border-green-500 text-white' : 'bg-gray-50 border-gray-200 focus:border-green-500'}`}
                        />
                        <button type="submit" className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600">Login</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex p-4 ${isDark ? 'bg-zinc-950 text-white' : 'bg-gray-100 text-black'}`}>
            <div className={`w-full max-w-6xl mx-auto h-[90vh] flex rounded-xl overflow-hidden shadow-2xl border ${isDark ? 'border-zinc-800 bg-[#111b21]' : 'border-gray-200 bg-white'}`}>
                
                {/* LEFT PANEL: Chat List */}
                <div className={`w-1/3 min-w-[300px] flex flex-col border-r ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
                    {/* Header */}
                    <div className={`p-4 flex justify-between items-center ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-100' : 'bg-zinc-900'}`}>
                                <User size={20} className={isDark ? 'text-black' : 'text-white'} />
                            </div>
                            <span className="font-bold">Aman (Admin)</span>
                        </div>
                        <button onClick={() => setIsAuthenticated(false)} className={`p-2 rounded-full ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'}`}>
                            <LogOut size={20} className={isDark ? 'text-zinc-400' : 'text-gray-600'} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className={`p-2 border-b ${isDark ? 'border-zinc-800 bg-[#111b21]' : 'border-gray-200 bg-white'}`}>
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-gray-100'}`}>
                            <Search size={18} className={isDark ? 'text-zinc-400' : 'text-gray-500'} />
                            <input 
                                type="text" 
                                placeholder="Search or start new chat" 
                                className="bg-transparent border-none outline-none text-sm w-full"
                            />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto">
                        {chats.map(chat => (
                            <div 
                                key={chat.id} 
                                onClick={() => setActiveChat(chat)}
                                className={`flex items-center gap-4 p-3 cursor-pointer transition-colors border-b ${isDark ? 'border-zinc-800/50 hover:bg-zinc-900' : 'border-gray-100 hover:bg-gray-50'} ${activeChat?.id === chat.id ? (isDark ? 'bg-zinc-800' : 'bg-gray-100') : ''}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}>
                                    <User size={24} className={isDark ? 'text-zinc-500' : 'text-gray-500'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-sm truncate">{chat.visitorName}</h3>
                                        <span className={`text-xs ${chat.unreadCount > 0 ? (isDark ? 'text-white' : 'text-black font-bold') : (isDark ? 'text-zinc-400' : 'text-gray-500')}`}>
                                            {formatTime(chat.lastActive)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-sm truncate ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{chat.lastMessage}</p>
                                        {chat.unreadCount > 0 && (
                                            <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isDark ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'}`}>
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL: Active Chat */}
                {activeChat ? (
                    <div className="flex-1 flex flex-col relative">
                        {/* Chat Header */}
                        <div className={`flex justify-between items-center p-3 border-b z-10 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}>
                                    <User size={20} className={isDark ? 'text-zinc-400' : 'text-gray-500'} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{activeChat.visitorName}</h3>
                                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{activeChat.visitorEmail}</p>
                                </div>
                            </div>
                            <button className={`p-2 rounded-full ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'}`}>
                                <MoreVertical size={20} className={isDark ? 'text-zinc-400' : 'text-gray-600'} />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-2 relative"
                             style={{ backgroundColor: isDark ? '#09090b' : '#fafafa' }}>
                            
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[65%] p-2 px-3 rounded-lg relative shadow-sm
                                        ${msg.sender === 'admin' 
                                            ? (isDark ? 'bg-zinc-700 rounded-tr-sm text-white' : 'bg-zinc-200 rounded-tr-sm text-black') 
                                            : (isDark ? 'bg-zinc-900 rounded-tl-sm text-white border border-zinc-800' : 'bg-white rounded-tl-sm text-black border border-gray-100')}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                            {formatTime(msg.timestamp)}
                                            {msg.sender === 'admin' && <CheckCheck size={14} className={isDark ? 'text-zinc-300' : 'text-zinc-600'} />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Footer */}
                        <div className={`p-4 flex items-center gap-4 ${isDark ? 'bg-zinc-900 border-t border-zinc-800' : 'bg-white border-t border-gray-200'}`}>
                            <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-4">
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message" 
                                    className={`flex-1 px-4 py-3 rounded-lg text-sm outline-none transition-colors ${isDark ? 'bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-800 focus:border-zinc-500' : 'bg-gray-50 text-black placeholder-zinc-400 border border-gray-200 focus:border-zinc-400'}`}
                                />
                                <button 
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${newMessage.trim() ? (isDark ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white') : (isDark ? 'bg-zinc-950 text-zinc-600 border border-zinc-800' : 'bg-gray-50 text-zinc-300 border border-gray-200')} `}
                                >
                                    <Send size={20} className={newMessage.trim() ? 'mr-0.5 mt-0.5' : ''} />
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className={`flex-1 flex flex-col items-center justify-center border-b-[6px] ${isDark ? 'border-zinc-500 bg-zinc-950' : 'border-zinc-900 bg-gray-50'}`}>
                        <div className={`w-72 h-72 rounded-full mb-8 flex items-center justify-center ${isDark ? 'bg-zinc-900' : 'bg-gray-200'}`}>
                            <Send size={100} className={isDark ? 'text-zinc-600' : 'text-gray-400'} />
                        </div>
                        <h2 className={`text-3xl font-light mb-4 ${isDark ? 'text-white' : 'text-gray-700'}`}>Secure Contact Web</h2>
                        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;
