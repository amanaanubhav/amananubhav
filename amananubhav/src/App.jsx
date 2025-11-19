import React, { useState, useEffect, useRef } from 'react';
import { 
  Github, Linkedin, Mail, FileText, Moon, Sun, 
  MessageSquare, X, Send, ArrowRight, Code, 
  Cpu, Globe, Award, Zap, ChevronRight, ExternalLink,
  Shield, Lock, Database, Server, Eye, EyeOff, Key, Hash
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';

// --- Firebase Setup ---
// NOTE: To run this locally in Vite, you must UNCOMMENT the import.meta.env lines
// and remove the check for __firebase_config.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? __firebase_config : {
  apiKey: "AIzaSyAA_HoCCSagZNg31t642wjwxIRrkIPU4uQ",
  authDomain: "amannbhv-m.firebaseapp.com",
  projectId: "amannbhv-m",
  storageBucket: "amannbhv-m.firebasestorage.app",
  messagingSenderId: "499252124944",
  appId: "1:499252124944:web:6a64ac80518d04873a1995",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : "portfolio-v1";

// --- CRYPTO & BLOCKCHAIN UTILS ---
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
    } catch (e) {
      return "Decryption Error";
    }
  }
};

// --- Portfolio Data ---
const RESUME_DATA = {
  name: "Aman Anubhav",
  role: "AI Researcher & Engineer",
  tagline: "Building intelligent agents for a better world.",
  about: "I am a Computer Science Engineering student at KIIT University (2027) and a Growth Specialist at Google Developers Group. My work bridges the gap between theoretical AI and real-world applications.",
  stats: [
    { label: "Asteroids Found", value: "2" },
    { label: "Global Audience", value: "2M+" },
    { label: "Hackathon Wins", value: "4+" }
  ],
  projects: [
    {
      title: "OceanBot",
      category: "Marine Intelligence",
      tech: ["Python", "TensorFlow", "InceptionV3"],
      desc: "Marine intelligence platform achieving 98.87% accuracy in classification using transfer learning.",
      link: "https://github.com/gitamannbhv"
    },
    {
      title: "Mario-RL",
      category: "Autonomous Agents",
      tech: ["RL", "DQN", "PPO"],
      desc: "Autonomous agent mastering Super Mario Bros. Improved level completion by 30% over baseline.",
      link: "https://github.com/gitamannbhv"
    },
    {
      title: "YVOO",
      category: "FinTech",
      tech: ["XGBoost", "Logistic Regression"],
      desc: "CIBIL Prediction system. Achieved 99% accuracy on synthetic datasets.",
      link: "https://github.com/gitamannbhv"
    },
    {
      title: "KANAD",
      category: "AgriTech",
      tech: ["IoT", "LSTM", "CNN"],
      desc: "Agricultural Intelligence System serving 23 farmers. Reduced water usage by 23%.",
      link: "https://github.com/gitamannbhv"
    }
  ],
  experience: [
    { role: "Growth Specialist", org: "Google Developers Group", year: "2024-Present", desc: "Top 8% talent. Drove 23% engagement growth." },
    { role: "Founder", org: "DeuxStem Org", year: "2020-Present", desc: "Scaled Ed-Tech non-profit to 2M+ global audience." },
    { role: "Student Ambassador", org: "Microsoft Learn", year: "2024", desc: "Contributed to Project Wing (RL Algorithms)." }
  ]
};

// --- GLOBAL COMPONENTS ---

const SpotlightCard = ({ children, className = "", hoverEffect = true }) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white shadow-sm transition-all duration-300 ${hoverEffect ? 'hover:shadow-md hover:scale-[1.01]' : ''} ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
};

const LoginForm = ({ view, setView, authForm, setAuthForm, handleAuth, loading, error, setError }) => (
  <div className="space-y-4 animate-in fade-in zoom-in duration-300">
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
        <Lock size={32} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold dark:text-white">Secure Access</h2>
      <p className="text-gray-500 text-sm mt-1">Blockchain-Verified Credentials</p>
    </div>

    {view === 'register' && (
      <>
        <input 
          type="text" placeholder="Full Name" 
          className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          value={authForm.name} onChange={e => setAuthForm(prev => ({...prev, name: e.target.value}))}
        />
        <div className="grid grid-cols-2 gap-4">
          <input 
            type="email" placeholder="Email" 
            className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            value={authForm.email} onChange={e => setAuthForm(prev => ({...prev, email: e.target.value}))}
          />
          <input 
            type="tel" placeholder="Phone" 
            className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            value={authForm.phone} onChange={e => setAuthForm(prev => ({...prev, phone: e.target.value}))}
          />
        </div>
      </>
    )}
    
    <input 
      type="text" placeholder="Secure Username" 
      className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
      value={authForm.username} onChange={e => setAuthForm(prev => ({...prev, username: e.target.value}))}
    />
    <input 
      type="password" placeholder="Password" 
      className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
      value={authForm.password} onChange={e => setAuthForm(prev => ({...prev, password: e.target.value}))}
    />

    {error && <div className="text-red-500 text-sm text-center bg-red-100 dark:bg-red-900/30 p-2 rounded">{error}</div>}

    <button 
      onClick={() => handleAuth(view === 'register')}
      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20"
    >
      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (view === 'register' ? 'Create Secure Profile' : 'Authenticate')}
    </button>

    <div className="text-center text-sm text-gray-500 mt-4">
      {view === 'register' ? 'Already have an ID? ' : 'New to the secure network? '}
      <button onClick={() => {setView(view === 'register' ? 'login' : 'register'); setError('');}} className="text-blue-500 hover:underline font-medium">
        {view === 'register' ? 'Login' : 'Register Profile'}
      </button>
    </div>
  </div>
);

const BlockDisplay = ({ block, showDecrypted = false }) => {
  const [decryptedText, setDecryptedText] = useState('');

  useEffect(() => {
    if (showDecrypted) {
      cryptoUtils.decrypt(block.encryptedData).then(setDecryptedText);
    }
  }, [showDecrypted, block.encryptedData]);

  return (
    <div className="p-4 mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-xs relative group overflow-hidden">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
      <div className="flex items-center gap-2 mb-2 text-blue-500">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="font-bold">BLOCK #{block.index}</span>
        <span className="text-gray-400 ml-auto">{new Date(block.timestamp).toLocaleTimeString()}</span>
      </div>
      <div className="grid grid-cols-[80px_1fr] gap-2 text-gray-600 dark:text-gray-400">
        <span className="font-bold">Hash:</span>
        <span className="truncate text-orange-500">{block.hash}</span>
        <span className="font-bold">PrevHash:</span>
        <span className="truncate opacity-50">{block.prevHash}</span>
        <span className="font-bold">Sender:</span>
        <span className="text-white bg-gray-700 px-1 rounded w-fit">{block.sender}</span>
        <span className="font-bold">Data:</span>
        <div className="p-2 bg-black/5 dark:bg-black/30 rounded break-all">
          {showDecrypted ? (
            <span className="text-green-500 font-bold flex items-center gap-2">
               <Eye size={12}/> {decryptedText}
            </span>
          ) : (
            <span className="opacity-70 flex items-center gap-2">
               <Lock size={12}/> {block.encryptedData.substring(0, 20)}...[ENCRYPTED]
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const SecurePortal = ({ user, db, onClose }) => {
  const [view, setView] = useState('login');
  const [secureUser, setSecureUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Inputs
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', username: '', password: '' });
  const [messageInput, setMessageInput] = useState('');
  
  // Data
  const [blockchain, setBlockchain] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const USERS_COLLECTION_PATH = ['artifacts', appId, 'public', 'data', 'secure_profiles'];

  const handleAuth = async (isRegister) => {
    setLoading(true);
    setError('');
    try {
      if (!isRegister && authForm.username === 'amannbhv' && authForm.password === 'youcantguess') {
        setSecureUser({ name: 'Admin', role: 'admin', username: 'amannbhv' });
        setView('admin');
        setLoading(false);
        return;
      }
      const passHash = await cryptoUtils.sha256(authForm.password);
      const usersRef = collection(db, ...USERS_COLLECTION_PATH);
      
      if (isRegister) {
        await addDoc(usersRef, {
          name: authForm.name, email: authForm.email, phone: authForm.phone,
          username: authForm.username, passHash: passHash, role: 'user', createdAt: serverTimestamp()
        });
        setSecureUser({ name: authForm.name, role: 'user', username: authForm.username });
        setView('dashboard');
      } else {
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        let foundUser = null;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.username === authForm.username && data.passHash === passHash) foundUser = data;
        });
        if (foundUser) {
          setSecureUser(foundUser);
          setView('dashboard');
        } else {
          setError('Invalid Credentials');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Security Protocol Failed: ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (view === 'dashboard' || view === 'admin') {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'blockchain_ledger'));
      const unsub = onSnapshot(q, (snapshot) => {
        const chain = snapshot.docs.map(doc => doc.data());
        chain.sort((a, b) => b.index - a.index);
        setBlockchain(chain);
      });
      return () => unsub();
    }
  }, [view, db]);

  useEffect(() => {
    if (view === 'admin') {
      const fetchUsers = async () => {
        const usersRef = collection(db, ...USERS_COLLECTION_PATH);
        const snapshot = await getDocs(usersRef);
        setAllUsers(snapshot.docs.map(doc => doc.data()));
      };
      fetchUsers();
    }
  }, [view, db]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    setLoading(true);
    try {
      const prevBlock = blockchain[0] || { hash: "0" };
      const encryptedMsg = await cryptoUtils.encrypt(messageInput);
      const timestamp = new Date().toISOString();
      const index = (blockchain.length || 0) + 1;
      const blockHeader = `${index}${prevBlock.hash}${timestamp}${secureUser.username}${encryptedMsg}`;
      const newHash = await cryptoUtils.sha256(blockHeader);

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'blockchain_ledger'), {
        index, timestamp, prevHash: prevBlock.hash, hash: newHash,
        sender: secureUser.username, encryptedData: encryptedMsg, status: 'verified'
      });
      setMessageInput('');
    } catch (err) {
      console.error(err);
      setError('Block Mining Failed: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-[#050505] flex flex-col">
      <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-500" />
          <span className="font-bold text-lg tracking-tight">Secure<span className="text-blue-500">Chain</span> v1.0</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-96 p-6 border-r border-gray-200 dark:border-gray-800 overflow-y-auto bg-gray-50/50 dark:bg-[#0a0a0a]">
          {(view === 'login' || view === 'register') ? (
            <div className="h-full flex flex-col justify-center">
              <LoginForm 
                view={view} setView={setView} 
                authForm={authForm} setAuthForm={setAuthForm}
                handleAuth={handleAuth} loading={loading} error={error} setError={setError}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg shadow-blue-900/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                    {secureUser?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{secureUser?.name}</div>
                    <div className="text-blue-200 text-xs uppercase tracking-wider">{secureUser?.role} Access</div>
                  </div>
                </div>
                <div className="text-xs font-mono bg-black/20 p-2 rounded mt-2 truncate">ID: {secureUser?.username}</div>
              </div>

              {view === 'dashboard' && (
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><Send size={16}/> New Secure Message</h3>
                  <textarea 
                    className="w-full bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm mb-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    rows={3}
                    placeholder="Message is encrypted before sending..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={loading}
                    className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold hover:opacity-90"
                  >
                    {loading ? 'Mining Block...' : 'Encrypt & Send to Chain'}
                  </button>
                </div>
              )}

              {view === 'admin' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Registered Profiles</h3>
                  {allUsers.map((u, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 text-sm">
                      <div className="font-bold flex justify-between">{u.name} <span className="text-xs text-gray-500 font-mono">{u.phone}</span></div>
                      <div className="text-gray-500 text-xs truncate">{u.email}</div>
                      <div className="text-xs font-mono text-orange-500 mt-1 truncate" title="Password Hash">Hash: {u.passHash?.substring(0, 10)}...</div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setView('login')} className="w-full py-2 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 text-sm">
                Terminate Session
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-hidden flex flex-col bg-white dark:bg-[#050505]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Database size={20} className="text-purple-500" />
              Live Blockchain Ledger
            </h2>
            <div className="flex gap-2 text-xs font-mono text-gray-500">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> SYNCED</span>
              <span className="flex items-center gap-1"><Lock size={10} /> AES-256</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {blockchain.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                <Server size={48} className="mb-4" />
                <p>Waiting for first block...</p>
              </div>
            ) : (
              blockchain.map((block, i) => (
                <BlockDisplay key={i} block={block} showDecrypted={view === 'admin'} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm Aman's AI assistant. Ask me about his projects, skills, or experience." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const lowerInput = userMsg.text.toLowerCase();
      let response = "I'm not sure about that, but you can email Aman directly!";
      if (lowerInput.includes('project') || lowerInput.includes('work')) response = "Aman has worked on OceanBot (Marine AI), Mario-RL (Gaming AI), and YVOO (FinTech). Which one interests you?";
      else if (lowerInput.includes('contact') || lowerInput.includes('email')) response = "You can reach Aman at amannbhv.cswork@gmail.com.";
      else if (lowerInput.includes('asteroid') || lowerInput.includes('space')) response = "Yes! Aman discovered 2 asteroids and received commendations from NASA & Pan-STARRS.";
      else if (lowerInput.includes('skills') || lowerInput.includes('tech')) response = "He is proficient in Python, TensorFlow, C++, and React. He specializes in RL and Computer Vision.";
      else if (lowerInput.includes('mario')) response = "For Mario-RL, he used DQN and PPO algorithms to improve level completion by 30%.";
      else if (lowerInput.includes('ocean')) response = "OceanBot uses InceptionV3 transfer learning and achieved 98.87% accuracy.";
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">Portfolio AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-2 flex gap-1 items-center"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex gap-2">
              <input 
                type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about projects..." className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
              <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors"><Send size={18} /></button>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110">
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState(null);
  const [showSecurePortal, setShowSecurePortal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState('idle');

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setFormStatus('submitting');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
        ...formData, userId: user.uid, timestamp: serverTimestamp()
      });
      setFormStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setFormStatus('idle'), 3000);
    } catch (error) {
      console.error("Error sending message:", error);
      setFormStatus('error');
    }
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans selection:bg-blue-500/30">
        {showSecurePortal && user && <SecurePortal user={user} db={db} onClose={() => setShowSecurePortal(false)} />}
        <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-[#0a0a0a]/70">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AA.</span>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
              {['home', 'projects', 'experience', 'contact'].map((item) => (
                <button key={item} onClick={() => setActiveSection(item)} className={`capitalize hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${activeSection === item ? 'text-blue-600 dark:text-blue-400' : ''}`}>{item}</button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowSecurePortal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all border border-red-500/20">
                <Shield size={12} /> SECURE ZONE
              </button>
              <a href="https://github.com/gitamannbhv" target="_blank" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"><Github size={20} /></a>
              <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            </div>
          </div>
        </nav>
        <main className="pt-24 pb-20 max-w-6xl mx-auto px-6 space-y-32">
          <section id="home" className="min-h-[60vh] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium w-fit mb-6 border border-blue-100 dark:border-blue-800"><Zap size={12} fill="currentColor" /> Available for collaborations</div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">Building the future with <br /><span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Intelligent Agents</span></h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10 leading-relaxed">{RESUME_DATA.about}</p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setActiveSection('projects')} className="px-8 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity flex items-center gap-2">View Projects <ArrowRight size={18} /></button>
              <button onClick={() => setActiveSection('contact')} className="px-8 py-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Contact Me</button>
            </div>
            <div className="grid grid-cols-3 gap-8 mt-20 pt-10 border-t border-gray-100 dark:border-gray-800">
              {RESUME_DATA.stats.map((stat, i) => (<div key={i}><div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div><div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</div></div>))}
            </div>
          </section>
          <section id="projects">
            <div className="flex items-end justify-between mb-12"><div><h2 className="text-3xl font-bold mb-4">Featured Work</h2><p className="text-gray-600 dark:text-gray-400">Selected projects in AI, ML, and IoT.</p></div><a href="https://github.com/gitamannbhv" className="hidden md:flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">View Github <ExternalLink size={16} /></a></div>
            <div className="grid md:grid-cols-2 gap-6">
              {RESUME_DATA.projects.map((project, index) => (
                <SpotlightCard key={index} className="h-full flex flex-col">
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-6"><div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400"><Code size={24} /></div><span className="text-xs font-mono text-gray-500 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded">{project.category}</span></div>
                    <h3 className="text-xl font-bold mb-3">{project.title}</h3><p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed text-sm flex-1">{project.desc}</p>
                    <div className="flex flex-wrap gap-2 mt-auto">{project.tech.map(t => (<span key={t} className="text-xs font-medium px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">{t}</span>))}</div>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </section>
          <section id="experience" className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold mb-8">Experience</h2>
              <div className="space-y-6">
                {RESUME_DATA.experience.map((exp, i) => (
                  <SpotlightCard key={i} hoverEffect={false}>
                    <div className="p-6 flex gap-4">
                      <div className="flex-shrink-0 mt-1"><div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><Award size={20} className="text-gray-600 dark:text-gray-400" /></div></div>
                      <div><h3 className="font-bold text-lg">{exp.role}</h3><div className="text-blue-600 dark:text-blue-400 text-sm mb-2">{exp.org} • {exp.year}</div><p className="text-gray-600 dark:text-gray-400 text-sm">{exp.desc}</p></div>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-8">Latest Blogs</h2>
              <div className="space-y-6">
                {[{ title: "Understanding DQN vs PPO in Mario AI", date: "Oct 15, 2025" }, { title: "How I discovered 2 Asteroids", date: "Sep 22, 2025" }, { title: "Optimizing AgriTech with IoT", date: "Aug 10, 2025" }].map((blog, i) => (
                  <a key={i} href="#" className="group block">
                    <SpotlightCard className="h-full">
                      <div className="p-6"><div className="text-xs text-gray-500 mb-2">{blog.date}</div><h3 className="font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">{blog.title}<ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" /></h3></div>
                    </SpotlightCard>
                  </a>
                ))}
              </div>
            </div>
          </section>
          <section id="contact" className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Let's Build Something Amazing</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-10">I'm currently looking for new opportunities in AI Research and Engineering. Whether you have a question or just want to say hi, my inbox is always open.</p>
            <SpotlightCard hoverEffect={false}>
              <form onSubmit={handleSubmit} className="p-8 text-left space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Name</label><input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="John Doe" /></div>
                  <div><label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label><input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="john@example.com" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Message</label><textarea required rows={4} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="I'd like to discuss a project..." /></div>
                <button disabled={formStatus === 'submitting' || formStatus === 'success'} type="submit" className={`w-full py-4 rounded-lg font-medium text-white transition-all flex justify-center items-center gap-2 ${formStatus === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} ${formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''}`}>{formStatus === 'submitting' && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}{formStatus === 'success' ? 'Message Sent!' : 'Send Collaboration Request'}</button>
              </form>
            </SpotlightCard>
          </section>
        </main>
        <footer className="py-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500">
          <div className="flex justify-center gap-6 mb-4"><a href="https://github.com/gitamannbhv" className="hover:text-gray-900 dark:hover:text-white transition-colors">GitHub</a><a href="https://www.linkedin.com/in/amananubhav/" className="hover:text-gray-900 dark:hover:text-white transition-colors">LinkedIn</a><a href="mailto:amannbhv.cswork@gmail.com" className="hover:text-gray-900 dark:hover:text-white transition-colors">Email</a></div>
          <p>&copy; {new Date().getFullYear()} Aman Anubhav. All rights reserved.</p>
        </footer>
        <ChatWidget />
      </div>
    </div>
  );
};

export default App;