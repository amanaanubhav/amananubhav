import React, { useState, useEffect, useRef } from 'react';
import { 
  Github, Linkedin, Mail, ArrowRight, Code, 
  Award, Zap, Shield, Lock, Database, Server, 
  Terminal, X, Maximize2, Minimize2, Sun, Moon, 
  AlertTriangle, Send, Trash2, ExternalLink, User, 
  Reply, Cpu, Activity, Globe, Search, Wifi
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, onSnapshot, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const getFirebaseConfig = () => {
  try {
    if (import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
      return {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };
    }
  } catch (e) {}
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
  return null;
};

const GEMINI_API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || "";

const firebaseConfig = getFirebaseConfig();
const isConfigValid = firebaseConfig && firebaseConfig.apiKey;

const app = isConfigValid ? initializeApp(firebaseConfig) : null;
const auth = isConfigValid ? getAuth(app) : null;
const db = isConfigValid ? getFirestore(app) : null;
const appId = "portfolio-v3-ultimate";

// --- Crypto Utils ---
const SYSTEM_SECRET = "MY_SUPER_SECRET_MASTER_KEY_2025";
const cryptoUtils = {
  sha256: async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
  encrypt: async (text) => {
    const textBytes = new TextEncoder().encode(text);
    const keyBytes = new TextEncoder().encode(SYSTEM_SECRET);
    const encryptedBytes = textBytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
    return btoa(String.fromCharCode(...encryptedBytes));
  },
  decrypt: async (cipherText) => {
    try {
      const encryptedBytes = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
      const keyBytes = new TextEncoder().encode(SYSTEM_SECRET);
      const decryptedBytes = encryptedBytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
      return new TextDecoder().decode(decryptedBytes);
    } catch (e) { return "Decryption Error"; }
  }
};

// --- Data ---
const RESUME = {
  name: "AMAN ANUBHAV",
  about: "I engineer intelligent agents and scalable systems. Computer Science Student @ KIIT University (2027). Growth Specialist @ GDG.",
  stats: [
    { label: "Asteroids Found", value: "02" },
    { label: "Global Impact", value: "2M+" },
    { label: "Hackathons", value: "04" }
  ],
  projects: [
    { id: "p1", title: "OceanBot", type: "Marine AI", tech: ["TensorFlow", "CV"], desc: "Marine intelligence platform achieving 98.87% accuracy in debris classification.", link: "https://github.com/gitamannbhv" },
    { id: "p2", title: "Mario-RL", type: "Autonomous Agent", tech: ["RL", "PPO", "DQN"], desc: "Autonomous agent mastering Super Mario Bros levels with custom reward functions.", link: "https://github.com/gitamannbhv" },
    { id: "p3", title: "YVOO", type: "FinTech", tech: ["XGBoost", "Analytics"], desc: "High-precision CIBIL score prediction engine for financial fraud detection.", link: "https://github.com/gitamannbhv" },
    { id: "p4", title: "KANAD", type: "AgriTech", tech: ["IoT", "Edge"], desc: "Smart irrigation system deployed for 23 farmers, reducing water usage by 23%.", link: "https://github.com/gitamannbhv" }
  ],
  experience: [
    { role: "Growth Specialist", org: "Google Developers Group", time: "2024 — Present", detail: "Top 8% talent. Drove 23% engagement growth across developer ecosystems." },
    { role: "Founder", org: "DeuxStem Org", time: "2020 — Present", detail: "Scaled an Ed-Tech non-profit to a global audience of 2M+, securing international partnerships." },
    { role: "Student Ambassador", org: "Microsoft Learn", time: "2024", detail: "Contributed to Project Wing, focusing on Reinforcement Learning algorithms." }
  ]
};

// --- Hooks ---
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 
  });
  useEffect(() => {
    let animationFrameId;
    const updateMousePosition = ev => {
      animationFrameId = window.requestAnimationFrame(() => {
        setMousePosition({ x: ev.clientX, y: ev.clientY });
      });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);
  return mousePosition;
};

// ==========================================
// 2. SUB-COMPONENTS
// ==========================================

const NavButton = ({ id, label, onClick, active }) => (
  <button 
    onClick={() => {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
      if (onClick) onClick(id);
    }}
    className={`relative px-4 py-2 text-xs font-bold tracking-widest transition-all duration-300 ${active ? 'text-app-accent after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-app-accent' : 'text-app-text-dim hover:text-app-accent'}`}
  >
    {label}
  </button>
);

const ThemeToggle = ({ theme, toggleTheme }) => (
  <button onClick={toggleTheme} className="p-2 rounded-full border border-app-border hover:bg-app-card transition-all text-app-text-dim hover:text-app-text">
    {theme === 'light' ? <Sun size={16} /> : theme === 'negative' ? <AlertTriangle size={16} className="text-orange-500"/> : <Moon size={16} />}
  </button>
);

// --- INVERTED LENS HERO (TEXT UPDATED) ---
const LensHero = () => {
  const { x, y } = useMousePosition();
  
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden cursor-none">
      
      {/* LAYER 1: Base Layer (Visible outside lens) */}
      {/* Matches the current theme (e.g., Dark BG, Silver Text) */}
      <div className="absolute inset-0 flex flex-col justify-center items-center bg-app-bg transition-colors duration-500 z-10">
        <div className="flex flex-col items-center pointer-events-none select-none space-y-4">
          <h2 className="text-xl md:text-2xl font-mono text-app-text-dim tracking-widest">
            &gt;_ AMAN ANUBHAV
          </h2>
          <h1 className="text-[11vw] md:text-[12vw] font-black leading-[0.8] tracking-tighter text-app-text">
            ENGINEER
          </h1>
          <h1 className="text-[11vw] md:text-[12vw] font-black leading-[0.8] tracking-tighter text-app-text">
            ARCHITECT
          </h1>
        </div>
      </div>

      {/* LAYER 2: Revealed Layer (Visible inside lens) */}
      {/* INVERTED COLORS: White/Metallic BG, Black Text */}
      <div 
        className="absolute inset-0 z-20 flex flex-col justify-center items-center bg-white pointer-events-none"
        style={{
          maskImage: `radial-gradient(280px circle at ${x}px ${y}px, black 0%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(280px circle at ${x}px ${y}px, black 0%, transparent 100%)`
        }}
      >
        {/* Decorative Grid inside Lens */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-multiply"></div>
        
        <div className="flex flex-col items-center pointer-events-none select-none space-y-4 relative z-10">
          <h2 className="text-xl md:text-2xl font-mono text-black font-bold tracking-widest">
            &gt;_ AMAN ANUBHAV
          </h2>
          <h1 className="text-[11vw] md:text-[12vw] font-black leading-[0.8] tracking-tighter text-black mix-blend-hard-light">
            ENGINEER
          </h1>
          <h1 className="text-[11vw] md:text-[12vw] font-black leading-[0.8] tracking-tighter text-black mix-blend-hard-light">
            ARCHITECT
          </h1>
        </div>
      </div>
      
      {/* Custom Cursor */}
      <div className="fixed top-0 left-0 w-12 h-12 border border-white mix-blend-difference rounded-full pointer-events-none z-50 transition-transform duration-75 flex items-center justify-center" style={{ transform: `translate(${x - 24}px, ${y - 24}px)` }}>
         <div className="w-1 h-1 bg-white rounded-full"></div>
      </div>
    </section>
  );
};

// --- AI TERMINAL ---
const TerminalOverlay = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState([
    { src: 'SYS', msg: 'Initializing Neural Link...' },
    { src: 'SYS', msg: 'Connecting to Gemini 2.5 Flash...' },
    { src: 'SYS', msg: 'Connected. Ask me about Aman.' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isOpen]);

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    const userQuery = input;
    setLogs(prev => [...prev, { src: 'USR', msg: userQuery }]);
    setInput('');
    setIsProcessing(true);

    try {
      // SIMULATION MODE IF NO KEY
      if (!GEMINI_API_KEY) {
        setTimeout(() => {
           let mockReply = "I don't have access to the real-time API right now, but here is cached data: ";
           if (userQuery.toLowerCase().includes("project")) mockReply += "Aman has built OceanBot (Marine AI) and Mario-RL (Reinforcement Learning).";
           else if (userQuery.toLowerCase().includes("contact")) mockReply += "You can reach him at amannbhv.cswork@gmail.com";
           else mockReply += "Aman is an AI Researcher & Engineer specializing in scalable systems and intelligent agents.";
           
           setLogs(prev => [...prev, { src: 'AI', msg: `[SIMULATION] ${mockReply}` }]);
           setIsProcessing(false);
        }, 800);
        return;
      }

      const systemPrompt = `You are an advanced AI assistant for Aman Anubhav's portfolio. 
      Context: ${JSON.stringify(RESUME)}.
      Instructions: Answer questions about Aman, his projects (OceanBot, Mario-RL), and experience. 
      Style: Tech-noir, concise, terminal-like.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        }
      );

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No valid response.";
      setLogs(prev => [...prev, { src: 'AI', msg: reply }]);

    } catch (err) {
      setLogs(prev => [...prev, { src: 'ERR', msg: err.message }]);
    } finally {
      if (GEMINI_API_KEY) setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono animate-in zoom-in duration-200">
      <div className="w-full max-w-3xl h-[600px] bg-matte-black border border-white/10 rounded shadow-2xl flex flex-col overflow-hidden relative">
        <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-white/5">
          <div className="flex items-center gap-2 text-xs text-app-accent">
            <Terminal size={14} />
            <span>GEMINI_LINK_V2.5</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <button onClick={onClose} className="hover:text-red-500 transition-colors"><X size={16} /></button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-3 text-sm z-10">
          {logs.map((l, i) => (
            <div key={i} className="flex gap-4 items-start">
              <span className={`w-10 font-bold mt-1 ${l.src === 'USR' ? 'text-app-accent' : l.src === 'AI' ? 'text-green-500' : l.src === 'ERR' ? 'text-red-500' : 'text-gray-500'}`}>{l.src}</span>
              <span className={`text-gray-300 whitespace-pre-wrap leading-relaxed ${l.src === 'AI' ? 'typewriter' : ''}`}>{l.msg}</span>
            </div>
          ))}
          {isProcessing && <div className="text-gray-500 animate-pulse ml-14">Processing query...</div>}
          <div ref={endRef} />
        </div>
        <div className="p-4 border-t border-white/10 bg-black z-10">
          <form onSubmit={handleCommand} className="flex gap-3 items-center">
            <span className="text-green-500 animate-pulse">➜</span>
            <input 
              autoFocus
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white font-mono placeholder-gray-700"
              placeholder="Ask about Aman's work..."
            />
            <button type="submit" className="text-app-accent disabled:opacity-50" disabled={isProcessing}><Send size={16}/></button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- SECURE VAULT ---
const SecureVault = ({ isOpen, onClose, user, db }) => {
  const [view, setView] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  const [regForm, setRegForm] = useState({ username: '', password: '', name: '', email: '', phone: '', org: '' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [msgInput, setMsgInput] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const handleAuth = async (isRegister) => {
    setLoading(true); setError('');
    try {
      const form = isRegister ? regForm : loginForm;
      if (!isRegister && form.username === 'amannbhv' && form.password === 'amans') {
        setActiveUser({ username: 'amannbhv', role: 'admin', name: 'Administrator' });
        setView('admin'); setLoading(false); return;
      }

      const passHash = await cryptoUtils.sha256(form.password);
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'vault_users');
      
      if (isRegister) {
        const q = query(usersRef); const snap = await getDocs(q);
        if (snap.docs.find(d => d.data().username === form.username)) throw new Error("Username taken");
        const newUser = { ...regForm, passHash, role: 'user', createdAt: serverTimestamp(), status: 'active' };
        delete newUser.password;
        await addDoc(usersRef, newUser);
        setActiveUser(newUser); setView('dashboard');
      } else {
        const q = query(usersRef); const snap = await getDocs(q);
        const userDoc = snap.docs.find(d => d.data().username === form.username && d.data().passHash === passHash);
        if (userDoc && userDoc.data().status !== 'blocked') { setActiveUser(userDoc.data()); setView('dashboard'); } 
        else { throw new Error("Invalid Credentials"); }
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  useEffect(() => {
    if (!db) return;
    if (view === 'dashboard' || view === 'admin') {
      const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'vault_messages')), (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        msgs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setMessages(msgs);
      });
      return () => unsub();
    }
  }, [view, db]);

  useEffect(() => {
    if (view === 'admin' && db) {
      getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'vault_users'))).then(snap => 
        setUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );
    }
  }, [view, db]);

  const sendMessage = async () => {
    if (!msgInput.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'vault_messages'), {
        sender: activeUser.username, senderName: activeUser.name, content: await cryptoUtils.encrypt(msgInput), timestamp: serverTimestamp(), replies: []
      });
      setMsgInput('');
    } catch (e) { setError("Transmission Failed"); }
  };

  const sendReply = async (msgId, currentReplies) => {
    if (!replyInput.trim()) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vault_messages', msgId), {
        replies: [...(currentReplies || []), { sender: 'Admin', text: replyInput, timestamp: new Date().toISOString() }]
      });
      setReplyInput(''); setReplyingTo(null);
    } catch (e) { setError("Reply Failed"); }
  };

  const deleteUser = async (userId) => {
    if(!confirm("Delete user?")) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vault_users', userId)); setUsersList(prev => prev.filter(u => u.id !== userId)); } catch(e) {}
  };

  const MessageBlock = ({ msg, isAdmin, isOwner }) => {
    const [decrypted, setDecrypted] = useState(null);
    useEffect(() => { if (isAdmin || isOwner) cryptoUtils.decrypt(msg.content).then(setDecrypted); }, [msg, isAdmin, isOwner]);
    
    return (
      <div className={`p-4 mb-3 rounded border transition-all ${isOwner ? 'border-app-accent/50 bg-app-accent/5' : 'border-app-border bg-app-bg'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-app-accent uppercase">{msg.senderName}</span>
          <span className="text-[10px] text-app-text-dim">{msg.timestamp?.toDate().toLocaleTimeString()}</span>
        </div>
        <div className="font-mono text-sm break-all text-app-text">
          {(isAdmin || isOwner) ? <span className="text-green-400">{decrypted || "Decrypting..."}</span> : <span className="text-app-text-dim opacity-50 flex items-center gap-2"><Lock size={12}/> [ENCRYPTED PAYLOAD]</span>}
        </div>
        {msg.replies?.map((r, i) => <div key={i} className="mt-2 pl-3 border-l border-app-text-dim text-xs text-app-text"><span className="font-bold">{r.sender}:</span> {r.text}</div>)}
        {isAdmin && (
          <div className="mt-3 pt-2 border-t border-app-border flex gap-2">
            {replyingTo === msg.id ? (
              <><input autoFocus className="flex-1 bg-black/30 border border-app-border px-2 text-xs text-white" value={replyInput} onChange={e=>setReplyInput(e.target.value)} placeholder="Reply..."/><button onClick={()=>sendReply(msg.id, msg.replies)} className="text-xs text-green-400">SEND</button><button onClick={()=>setReplyingTo(null)} className="text-xs text-red-400">X</button></>
            ) : <button onClick={()=>setReplyingTo(msg.id)} className="flex items-center gap-1 text-xs text-app-accent hover:underline"><Reply size={12}/> REPLY</button>}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-red-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in zoom-in duration-300 font-mono">
      <div className="w-full max-w-4xl h-[80vh] bg-black border border-red-900/50 rounded-lg shadow-[0_0_50px_rgba(153,27,27,0.3)] flex overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-red-500 hover:text-white z-20"><X/></button>
        
        {/* Sidebar */}
        <div className="w-64 border-r border-red-900/30 p-6 bg-black hidden md:block relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600 shadow-[0_0_20px_red]"></div>
          <div className="flex items-center gap-2 mb-12 text-red-500 font-bold tracking-widest"><Shield size={20}/> VAULT_OS</div>
          {activeUser && (
            <div className="mb-8 p-4 border border-red-900/30 bg-red-950/10 rounded">
              <div className="text-[10px] text-red-400 mb-1">OPERATOR</div>
              <div className="font-bold text-white truncate">{activeUser.name}</div>
              <div className="text-[10px] text-red-500 uppercase mt-1 flex items-center gap-1"><Lock size={10}/> {activeUser.role}</div>
            </div>
          )}
          {view !== 'login' && <button onClick={()=>setView('login')} className="w-full text-left px-4 py-3 text-xs text-red-400 hover:bg-red-950/50 border border-transparent hover:border-red-900/30 rounded transition-colors">TERMINATE SESSION</button>}
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col relative bg-black/90">
          {(view === 'login' || view === 'register') && (
            <div className="flex-1 flex-col items-center justify-center p-8 flex">
              <div className="w-full max-w-sm space-y-6">
                 <div className="text-center">
                   <h2 className="text-3xl font-bold text-white tracking-tighter mb-2">SECURE ACCESS</h2>
                   <p className="text-red-500 text-xs tracking-widest">LEVEL 5 ENCRYPTION</p>
                 </div>
                {view === 'register' && <div className="grid grid-cols-2 gap-2"><input placeholder="Full Name" className="auth-input" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} /><input placeholder="Org" className="auth-input" value={regForm.org} onChange={e => setRegForm({...regForm, org: e.target.value})} /><input placeholder="Email" className="auth-input" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} /><input placeholder="Phone" className="auth-input" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} /></div>}
                <input placeholder="Username" className="auth-input w-full" value={view === 'register' ? regForm.username : loginForm.username} onChange={e => view === 'register' ? setRegForm({...regForm, username: e.target.value}) : setLoginForm({...loginForm, username: e.target.value})} />
                <input type="password" placeholder="Password" className="auth-input w-full" value={view === 'register' ? regForm.password : loginForm.password} onChange={e => view === 'register' ? setRegForm({...regForm, password: e.target.value}) : setLoginForm({...loginForm, password: e.target.value})} />
                {error && <div className="text-red-500 text-xs bg-red-950/30 p-2 border border-red-900/50 text-center">{error}</div>}
                <button onClick={() => handleAuth(view === 'register')} className="w-full py-4 bg-red-900 hover:bg-red-800 text-white font-bold tracking-widest rounded transition-all shadow-lg shadow-red-900/20">{loading ? 'Authenticating...' : 'ENTER VAULT'}</button>
                <div className="text-center text-xs mt-4"><button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="text-red-400 hover:text-white underline transition-colors">{view === 'login' ? 'Create Identity' : 'Back to Login'}</button></div>
              </div>
            </div>
          )}

          {(view === 'dashboard' || view === 'admin') && (
            <div className="flex-1 flex flex-col h-full">
              <div className="p-4 border-b border-red-900/30 flex justify-between items-center">
                <h3 className="text-white font-bold flex items-center gap-2 tracking-wider"><Database size={16} className="text-red-500"/> LEDGER STREAM</h3>
                <span className="text-[10px] text-red-500 animate-pulse">● LIVE</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map(msg => (
                  <MessageBlock key={msg.id} msg={msg} isOwner={msg.sender === activeUser.username} isAdmin={view === 'admin'} />
                ))}
              </div>
              {view !== 'admin' && (
                <div className="p-4 border-t border-red-900/30 bg-black"><div className="flex gap-2"><input className="flex-1 bg-red-950/10 border border-red-900/30 p-3 text-sm text-white outline-none focus:border-red-500 transition-colors placeholder-red-900/50" placeholder="Enter classified payload..." value={msgInput} onChange={e => setMsgInput(e.target.value)} /><button onClick={sendMessage} className="px-6 bg-white text-black font-bold hover:bg-gray-200 text-xs tracking-wider">UPLOAD</button></div></div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`.auth-input { width: 100%; background: rgba(50,0,0,0.2); border: 1px solid rgba(100,0,0,0.3); padding: 12px; color: white; font-size: 14px; outline: none; transition: border-color 0.2s; } .auth-input:focus { border-color: red; }`}</style>
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [theme, setTheme] = useState('dark');
  const [activeSection, setActiveSection] = useState('home');
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    const init = async () => {
      try { 
        if (isConfigValid && auth) await signInAnonymously(auth); 
      } catch(e) { console.error("Auth Error:", e); }
    };
    init();
    if (auth) return onAuthStateChanged(auth, setUser);
  }, [theme]);

  const cycleTheme = () => { const next = theme === 'dark' ? 'light' : (theme === 'light' ? 'negative' : 'dark'); setTheme(next); };
  const getThemeIcon = () => { if (theme === 'light') return <Sun size={16}/>; if (theme === 'negative') return <AlertTriangle size={16}/>; return <Moon size={16}/>; };

  const handleSecureClick = () => {
    // Fallback logic for easy testing
    if (!isConfigValid) {
      if (confirm("Firebase not configured. Open Vault UI in Offline Mode?")) {
        setIsVaultOpen(true);
        return;
      }
    }
    setIsVaultOpen(true);
  };

  if (!isConfigValid && !import.meta.env) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center p-4 text-center font-mono"><h1>ERROR: .env variables missing.</h1></div>;

  return (
    <div className="font-sans text-app-text bg-app-bg min-h-screen transition-colors duration-300 selection:bg-app-accent/30">
      
      {isVaultOpen && <SecureVault user={user} db={db} onClose={() => setIsVaultOpen(false)} />}
      <TerminalOverlay isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} />
      
      <nav className="fixed top-0 w-full z-40 backdrop-blur-md border-b border-app-border transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <span className="text-2xl font-black tracking-tighter bg-app-gradient bg-clip-text text-transparent cursor-pointer">AA.</span>
          <div className="hidden md:flex gap-10">
             {['projects', 'experience', 'contact'].map(id => (
               <NavButton key={id} id={id} label={id.toUpperCase()} onClick={setActiveSection} active={activeSection === id} />
             ))}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsTerminalOpen(true)} className="p-2 hover:text-app-accent transition-colors" title="Open AI Terminal"><Terminal size={18}/></button>
            <button 
              onClick={handleSecureClick}
              className="flex items-center gap-2 px-4 py-2 bg-red-900 text-white text-[10px] font-bold tracking-widest rounded-sm hover:bg-red-800 transition-colors shadow-lg border border-red-800"
            >
              <Lock size={12} /> SECURE VAULT
            </button>
            <button onClick={cycleTheme} className="p-2 rounded-full border border-app-border text-app-text-dim hover:text-app-text transition-colors">
               {getThemeIcon()}
            </button>
          </div>
        </div>
      </nav>

      <LensHero />
      
      <section id="projects" className="px-6 py-32 max-w-7xl mx-auto">
        <div className="mb-16 border-b border-app-border pb-4 flex justify-between items-end">
          <h2 className="text-4xl font-bold tracking-tight text-app-text">SELECTED WORKS</h2>
          <a href="https://github.com/gitamannbhv" target="_blank" className="text-xs font-bold tracking-widest flex items-center gap-2 text-app-text-dim hover:text-app-accent transition-colors">GITHUB <ArrowRight size={12}/></a>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {RESUME.projects.map((p, i) => (
            <a href={p.link} key={i} target="_blank" className="group block bg-app-card border border-app-border p-8 hover:border-app-accent/50 transition-all hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity text-app-accent"><ExternalLink size={20}/></div>
              <div className="flex justify-between items-start mb-8">
                <Code className="text-app-accent"/>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-app-text">{p.title}</h3>
              <p className="text-sm text-app-text-dim mb-4 leading-relaxed">{p.desc}</p>
              <div className="flex gap-2 flex-wrap">
                {p.tech.map(t => <span key={t} className="text-[10px] border border-app-border px-2 py-1 uppercase tracking-wider text-app-text-dim">{t}</span>)}
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="experience" className="px-6 py-32 bg-app-card/30">
         <div className="max-w-4xl mx-auto">
           <h2 className="text-xs font-mono text-app-text-dim mb-12 tracking-widest">EXPERIENCE LOG</h2>
           <div className="space-y-12 border-l border-app-border ml-2">
             {RESUME.experience.map((exp, i) => (
               <div key={i} className="pl-8 relative group">
                 <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 bg-app-bg border border-app-border rounded-full group-hover:bg-app-accent transition-colors"></div>
                 <div className="flex flex-col md:flex-row justify-between mb-2">
                   <h3 className="text-xl font-bold text-app-text">{exp.role}</h3>
                   <span className="text-xs font-mono text-app-text-dim">{exp.time}</span>
                 </div>
                 <div className="text-sm font-bold text-app-text-dim mb-2">{exp.org}</div>
                 <p className="text-app-text text-sm max-w-xl leading-relaxed">{exp.detail}</p>
               </div>
             ))}
           </div>
         </div>
      </section>

      <footer className="px-6 py-20 border-t border-app-border text-center overflow-hidden">
         <h2 className="text-[12vw] font-black text-app-text opacity-5 leading-none select-none pointer-events-none">
           ANUBHAV
         </h2>
         <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-8">
           <a href="mailto:amannbhv.cswork@gmail.com" className="text-xs font-bold tracking-widest text-app-text-dim hover:text-app-accent transition-colors">EMAIL</a>
           <a href="https://www.linkedin.com/in/amananubhav/" className="text-xs font-bold tracking-widest text-app-text-dim hover:text-app-accent transition-colors">LINKEDIN</a>
           <a href="https://github.com/gitamannbhv" className="text-xs font-bold tracking-widest text-app-text-dim hover:text-app-accent transition-colors">GITHUB</a>
         </div>
         <p className="mt-8 text-app-text-dim text-xs font-mono opacity-50">&copy; {new Date().getFullYear()} AMAN ANUBHAV. SYSTEMS ONLINE.</p>
      </footer>
    </div>
  );
};

export default App;