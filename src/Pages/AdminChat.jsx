import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, User, CheckCheck, MoreVertical, LogOut, Terminal, Activity, Ban, Trash2 } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { db } from '../Utils/firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, addDoc, serverTimestamp, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';

const AdminChat = ({ isDark }) => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authInput, setAuthInput] = useState('');
    
    const messagesEndRef = useRef(null);

    // CSS injection to hide the floating chat on the admin portal
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'hide-floating-chat';
        style.innerHTML = `
            .fixed.bottom-6.right-6.z-\\[100\\],
            .fixed.bottom-6.right-6.z-[100] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
        return () => {
            const existingStyle = document.getElementById('hide-floating-chat');
            if (existingStyle) {
                existingStyle.remove();
            }
        };
    }, []);

    // Mock authentication for prototype
    const handleLogin = (e) => {
        e.preventDefault();
        if (authInput === 'youcantguess') {
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
                try {
                    const res = await emailjs.send(
                        import.meta.env.VITE_EMAILJS_SERVICE_ID,
                        import.meta.env.VITE_EMAILJS_TEMPLATE_ID_TO_VISITOR,
                        {
                            to_email: activeChat.visitorEmail,
                            to_name: activeChat.visitorName,
                            reply_message: text,
                        },
                        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
                    );
                    console.log("EmailJS Success (to Visitor):", res.status, res.text);
                } catch (err) {
                    console.error("EmailJS Error (to Visitor):", err);
                }
            } else {
                console.warn("EmailJS credentials not configured yet. Check .env file.");
            }

        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleDeleteChat = async () => {
        if (!activeChat || !db) return;
        if (window.confirm(`Are you sure you want to permanently delete all transmissions from ${activeChat.visitorName || activeChat.id}? This will erase all data globally from the Firebase database.`)) {
            try {
                // To fully delete a document in Firebase from the client, we must delete its subcollections first
                const messagesRef = collection(db, 'contact_chats', activeChat.id, 'messages');
                const messagesSnapshot = await getDocs(messagesRef);
                
                const batch = writeBatch(db);
                // Add all messages to the batch delete
                messagesSnapshot.forEach((messageDoc) => {
                    batch.delete(messageDoc.ref);
                });
                
                // Add the parent document to the batch delete
                const parentDocRef = doc(db, 'contact_chats', activeChat.id);
                batch.delete(parentDocRef);
                
                // Commit the global deletion to Firebase
                await batch.commit();
                
                setActiveChat(null);
            } catch (error) {
                console.error("Error deleting chat globally from Firebase:", error);
            }
        }
    };

    const handleBlockUser = async () => {
        if (!activeChat || !db) return;
        const newStatus = !activeChat.isBlocked;
        try {
            await setDoc(doc(db, 'contact_chats', activeChat.id), {
                isBlocked: newStatus
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling block status:", error);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date();
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isAuthenticated) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-4 pt-32 font-mono ${isDark ? 'bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
                <div className={`w-full max-w-md p-10 shadow-2xl border transition-all ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}>
                    <div className="flex justify-center mb-6">
                        <Terminal size={48} className={isDark ? "text-white" : "text-black"} />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-widest mb-2 text-center">Admin Portal</h2>
                    <p className={`text-xs uppercase tracking-widest text-center mb-8 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>SECURE ACCESS REQUIRED</p>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <input 
                            type="password" 
                            placeholder="AUTHORIZATION CODE" 
                            value={authInput}
                            onChange={(e) => setAuthInput(e.target.value)}
                            className={`w-full px-4 py-4 border outline-none text-sm uppercase tracking-widest transition-all ${isDark ? 'bg-black border-zinc-800 focus:border-white text-white placeholder-zinc-700' : 'bg-gray-50 border-gray-300 focus:border-black text-black placeholder-zinc-400'}`}
                        />
                        <button 
                            type="submit" 
                            className={`w-full font-black py-4 transition-all text-xs border uppercase tracking-widest ${isDark ? 'bg-white border-white text-black hover:bg-black hover:text-white' : 'bg-black border-black text-white hover:bg-white hover:text-black'}`}
                        >
                            INITIALIZE OVERRIDE
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex flex-col pt-32 pb-12 px-6 font-mono ${isDark ? 'bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
            <div className={`w-full max-w-7xl mx-auto flex-1 flex h-[80vh] border shadow-2xl ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-gray-300 bg-white'}`}>
                
                {/* LEFT PANEL: Chat List */}
                <div className={`w-1/3 min-w-[320px] flex flex-col border-r ${isDark ? 'border-zinc-800' : 'border-gray-300'}`}>
                    {/* Header */}
                    <div className={`p-5 flex justify-between items-center border-b ${isDark ? 'bg-black border-zinc-800' : 'bg-gray-100 border-gray-300'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center border ${isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'}`}>
                                <Terminal size={16} />
                            </div>
                            <div>
                                <span className="font-black uppercase tracking-widest text-sm block">SYSTEM ADMIN</span>
                                <span className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-green-500' : 'text-green-600'}`}>ONLINE</span>
                            </div>
                        </div>
                        <button onClick={() => setIsAuthenticated(false)} className={`p-2 transition-colors border ${isDark ? 'hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-gray-200 border-gray-300 text-gray-600 hover:text-black'}`}>
                            <LogOut size={16} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className={`p-4 border-b ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-gray-300 bg-white'}`}>
                        <div className={`flex items-center gap-3 px-4 py-3 border ${isDark ? 'bg-black border-zinc-800' : 'bg-gray-50 border-gray-300'}`}>
                            <Search size={16} className={isDark ? 'text-zinc-600' : 'text-gray-400'} />
                            <input 
                                type="text" 
                                placeholder="SEARCH TRANSMISSIONS..." 
                                className={`bg-transparent border-none outline-none text-xs w-full uppercase tracking-widest ${isDark ? 'placeholder-zinc-700' : 'placeholder-gray-400'}`}
                            />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto">
                        {chats.map(chat => (
                            <div 
                                key={chat.id} 
                                onClick={() => setActiveChat(chat)}
                                className={`flex items-center gap-4 p-5 cursor-pointer transition-colors border-b ${isDark ? 'border-zinc-800/50 hover:bg-zinc-900' : 'border-gray-200 hover:bg-gray-50'} ${activeChat?.id === chat.id ? (isDark ? 'bg-zinc-900 border-l-4 border-l-white' : 'bg-gray-100 border-l-4 border-l-black') : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 border uppercase font-black text-lg ${isDark ? 'bg-black border-zinc-700 text-zinc-500' : 'bg-white border-gray-300 text-gray-500'}`}>
                                    {(chat.visitorName || chat.name || chat.id)[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-xs uppercase tracking-wider truncate">
                                            {chat.visitorName || chat.name || chat.id.replace(/_/g, ' ')}
                                        </h3>
                                        <span className={`text-[10px] tracking-wider ${chat.unreadCount > 0 ? (isDark ? 'text-white font-bold' : 'text-black font-bold') : (isDark ? 'text-zinc-600' : 'text-gray-500')}`}>
                                            {formatTime(chat.lastActive)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-[10px] truncate uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                                            {chat.visitorEmail || chat.email || 'UNKNOWN_ORIGIN'}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <p className={`text-xs truncate ${isDark ? 'text-zinc-400' : 'text-zinc-600'} ${chat.unreadCount > 0 ? 'font-bold text-white' : ''}`}>
                                            {chat.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {chats.length === 0 && (
                            <div className="p-8 text-center">
                                <p className={`text-xs uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>NO ACTIVE TRANSMISSIONS</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: Active Chat */}
                {activeChat ? (
                    <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-transparent">
                        {/* Chat Header */}
                        <div className={`flex justify-between items-center p-5 border-b z-10 ${isDark ? 'bg-black border-zinc-800' : 'bg-gray-100 border-gray-300'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 flex items-center justify-center border font-black text-xl uppercase ${isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-300 text-black'}`}>
                                    {(activeChat.visitorName || activeChat.name || activeChat.id)[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-widest text-lg">
                                        {activeChat.visitorName || activeChat.name || activeChat.id.replace(/_/g, ' ')}
                                    </h3>
                                    <div className="flex flex-col sm:flex-row sm:gap-6 mt-1">
                                        <span className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                            ID: {activeChat.visitorEmail || activeChat.email || activeChat.id}
                                        </span>
                                        <span className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                            COM: {activeChat.visitorPhone || activeChat.phone || 'UNAVAILABLE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleBlockUser} className={`text-[10px] uppercase tracking-widest px-3 py-2 border transition-all flex items-center gap-1 ${activeChat.isBlocked ? (isDark ? 'bg-red-900/20 text-red-500 border-red-900' : 'bg-red-100 text-red-600 border-red-200') : (isDark ? 'hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-gray-200 border-gray-300 text-gray-500 hover:text-black')}`} title={activeChat.isBlocked ? "Unblock Origin" : "Block Origin"}>
                                    <Ban size={12} />
                                    {activeChat.isBlocked ? 'BLOCKED' : 'BLOCK'}
                                </button>
                                <button onClick={handleDeleteChat} className={`text-[10px] uppercase tracking-widest px-3 py-2 border transition-all flex items-center gap-1 ${isDark ? 'hover:bg-red-900/20 border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-900' : 'hover:bg-red-50 border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-200'}`} title="Delete Transmission">
                                    <Trash2 size={12} />
                                    DELETE
                                </button>
                                <span className={`text-[10px] uppercase tracking-widest px-2 py-2 border ${isDark ? 'border-zinc-800 text-zinc-500 bg-zinc-900' : 'border-gray-300 text-gray-500 bg-gray-100'}`}>
                                    LIVE CONNECTION
                                </span>
                            </div>
                        </div>

                        {/* Chat Body */}
                        <div className={`flex-1 overflow-y-auto p-8 space-y-4 relative ${isDark ? 'bg-[#050505]' : 'bg-[#fcfcfc]'}`}>
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] p-4 relative shadow-sm border
                                        ${msg.sender === 'admin' 
                                            ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black') 
                                            : (isDark ? 'bg-black text-zinc-200 border-zinc-800' : 'bg-white text-zinc-800 border-gray-300')}`}>
                                        
                                        <div className={`text-[9px] uppercase tracking-widest mb-2 pb-2 border-b ${msg.sender === 'admin' ? (isDark ? 'border-zinc-300 text-zinc-600' : 'border-zinc-700 text-zinc-400') : (isDark ? 'border-zinc-800 text-zinc-500' : 'border-gray-200 text-gray-400')}`}>
                                            {msg.sender === 'admin' ? 'SYSTEM_ADMIN' : 'VISITOR_TERMINAL'}
                                        </div>
                                        
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                        
                                        <div className={`text-[9px] flex items-center justify-end gap-1 mt-3 ${msg.sender === 'admin' ? (isDark ? 'text-zinc-500' : 'text-zinc-400') : (isDark ? 'text-zinc-600' : 'text-gray-400')}`}>
                                            {formatTime(msg.timestamp)}
                                            {msg.sender === 'admin' && <CheckCheck size={12} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Footer */}
                        <div className={`p-6 border-t ${isDark ? 'bg-black border-zinc-800' : 'bg-gray-100 border-gray-300'}`}>
                            <form onSubmit={handleSendMessage} className="flex-1 flex items-stretch gap-4">
                                <textarea 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    disabled={activeChat.isBlocked}
                                    placeholder={activeChat.isBlocked ? "TRANSMISSION BLOCKED..." : "TYPE YOUR RESPONSE..."} 
                                    className={`flex-1 px-4 py-4 text-sm outline-none transition-colors border resize-none h-14 ${isDark ? 'bg-zinc-950 text-white placeholder-zinc-700 border-zinc-800 focus:border-white' : 'bg-white text-black placeholder-zinc-400 border-gray-300 focus:border-black'} ${activeChat.isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                                <button 
                                    type="submit"
                                    disabled={!newMessage.trim() || activeChat.isBlocked}
                                    className={`px-8 flex flex-col items-center justify-center transition-all border uppercase tracking-widest text-[10px] font-black ${newMessage.trim() && !activeChat.isBlocked ? (isDark ? 'bg-white text-black border-white hover:bg-zinc-200' : 'bg-black text-white border-black hover:bg-zinc-800') : (isDark ? 'bg-zinc-950 text-zinc-700 border-zinc-800 cursor-not-allowed' : 'bg-gray-50 text-zinc-300 border-gray-300 cursor-not-allowed')} `}
                                >
                                    <Send size={20} className="mb-1" />
                                    TRANSMIT
                                </button>
                            </form>
                            <p className={`text-[9px] uppercase tracking-widest mt-3 text-right ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
                                PRESS ENTER TO SEND • SHIFT+ENTER FOR NEW LINE
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={`flex-1 flex flex-col items-center justify-center ${isDark ? 'bg-[#050505]' : 'bg-[#fcfcfc]'}`}>
                        <div className={`w-32 h-32 border mb-8 flex items-center justify-center ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-300'}`}>
                            <Activity size={48} className={isDark ? 'text-zinc-800' : 'text-gray-200'} />
                        </div>
                        <h2 className={`text-2xl font-black uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>AWAITING CONNECTION</h2>
                        <p className={`text-xs uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>SELECT A TRANSMISSION TO INTERCEPT</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;
