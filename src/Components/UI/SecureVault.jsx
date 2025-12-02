import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Lock, Unlock, Database, AlertTriangle, CheckCircle, 
  Plus, Key, RefreshCw, FileJson, Trash2, Bug, Terminal, 
  User, LogOut, Eye, EyeOff, Server, X, MessageSquare
} from 'lucide-react';
import { 
  collection, addDoc, serverTimestamp, query, onSnapshot, 
  getDocs, deleteDoc, doc, updateDoc, where 
} from 'firebase/firestore';
import { db } from '../../Utils/firebase';

const appId = "amananubhav_securevault";
const ADMIN_CHANNEL_SECRET = "Admin_Access_Protocol_v5_Secure_Key_99";

// --- CRYPTO UTILS (Optimized) ---
const PBKDF2_ITERATIONS = 2000; 

const deriveKey = async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
};

const encryptData = async (key, data) => {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = enc.encode(JSON.stringify(data));
  const encryptedContent = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, encodedData);
  
  const buffer = new Uint8Array(iv.byteLength + encryptedContent.byteLength);
  buffer.set(iv, 0);
  buffer.set(new Uint8Array(encryptedContent), iv.byteLength);
  return btoa(String.fromCharCode(...buffer));
};

const decryptData = async (key, encryptedBase64) => {
  try {
    const binaryString = atob(encryptedBase64);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) { buffer[i] = binaryString.charCodeAt(i); }
    
    const iv = buffer.slice(0, 12);
    const data = buffer.slice(12);
    
    const decryptedContent = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data);
    return JSON.parse(new TextDecoder().decode(decryptedContent));
  } catch (e) { 
    throw new Error("Decryption failed."); 
  }
};

const computeHash = async (dataString) => {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(dataString));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// --- MAIN COMPONENT ---
const SecureVault = ({ isOpen, onClose }) => {
  const [view, setView] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userKey, setUserKey] = useState(null);   
  const [adminKey, setAdminKey] = useState(null); 
  
  const [regForm, setRegForm] = useState({ username: '', password: '', fullName: '', org: '' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [msgInput, setMsgInput] = useState('');
  
  const [chain, setChain] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('ledger');
  const chainEndRef = useRef(null);

  const switchView = (newView) => {
    setError('');
    setSuccessMsg('');
    setLoading(false);
    setView(newView);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if(!regForm.username || !regForm.password) return setError("Credentials required.");
    setLoading(true); setError('');
    
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'vault_users'), where("username", "==", regForm.username));
      const snap = await getDocs(q);
      if (!snap.empty) throw new Error("Username taken.");

      const passwordHash = await computeHash(regForm.password);
      
      const newUser = {
        username: regForm.username,
        fullName: regForm.fullName,
        org: regForm.org,
        passwordHash, 
        role: 'user',
        createdAt: serverTimestamp(),
        status: 'active'
      };

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'vault_users'), newUser);
      
      // FIX: Redirect to login on success
      setLoginForm({ username: regForm.username, password: '' });
      setSuccessMsg("Identity Generated Successfully. Please Authenticate.");
      switchView('login');
      
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) return;
    setLoading(true); setError(''); setSuccessMsg('');

    try {
      if (loginForm.username === 'amananubhav' && loginForm.password === 'youcantguess') {
        setCurrentUser({ username: 'amananubhav', role: 'admin', fullName: 'System Administrator' });
        const admKey = await deriveKey(ADMIN_CHANNEL_SECRET, "admin_salt_v5");
        setAdminKey(admKey);
        setView('dashboard');
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'vault_users'), where("username", "==", loginForm.username));
      const snap = await getDocs(q);
      
      if (snap.empty) throw new Error("User not found.");
      
      const userData = snap.docs[0].data();
      const inputHash = await computeHash(loginForm.password);

      if (userData.passwordHash !== inputHash) throw new Error("Invalid password.");
      if (userData.status === 'blocked') throw new Error("Account Blocked.");

      const key = await deriveKey(loginForm.password, loginForm.username);
      setUserKey(key);
      setCurrentUser({ id: snap.docs[0].id, ...userData });
      setView('dashboard');

    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserKey(null);
    setAdminKey(null);
    switchView('login');
    setLoginForm({ username: '', password: '' });
    setChain([]);
  };

  useEffect(() => {
    if (view !== 'dashboard' || !db) return;

    const chainUnsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'vault_chain')), async (snapshot) => {
      const fetchedChain = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedChain.sort((a, b) => a.index - b.index);

      const processedChain = await Promise.all(fetchedChain.map(async (block) => {
        let decrypted = null;
        let source = null;

        if (currentUser?.role === 'admin' && adminKey && block.adminPayload) {
            try {
                const content = await decryptData(adminKey, block.adminPayload);
                decrypted = content;
                source = 'admin';
            } catch (e) { /* */ }
        }

        if (userKey && block.userPayload) {
            try {
                const content = await decryptData(userKey, block.userPayload);
                if (content.sender === block.sender) {
                    decrypted = content;
                    source = 'user';
                }
            } catch (e) { /* */ }
        }

        return { ...block, decryptedContent: decrypted, decryptSource: source };
      }));

      setChain(processedChain);
      setTimeout(() => chainEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    });

    let usersUnsub = () => {};
    if (currentUser?.role === 'admin') {
      usersUnsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'vault_users'), (snap) => {
        setUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    return () => { chainUnsub(); usersUnsub(); };
  }, [view, currentUser, userKey, adminKey]);

  const handleAddBlock = async () => {
    if (!msgInput.trim()) return;
    
    const messageToCommit = msgInput;
    setMsgInput(''); // FIX: Clear input immediately

    try {
      const index = chain.length;
      const previousHash = index === 0 ? '0' : chain[index - 1].hash;
      const payload = { sender: currentUser.username, text: messageToCommit, timestamp: Date.now() };

      const userPayload = await encryptData(userKey, payload);
      const adminKeyTemp = await deriveKey(ADMIN_CHANNEL_SECRET, "admin_salt_v5");
      const adminPayload = await encryptData(adminKeyTemp, payload);

      const hash = await computeHash(`${index}${previousHash}${userPayload}`);

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'vault_chain'), {
        index, previousHash, userPayload, adminPayload, hash, sender: currentUser.username, timestamp: serverTimestamp()
      });
    } catch (err) { console.error(err); setError("Failed to commit block."); }
  };

  const deleteBlock = async (id) => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vault_chain', id));
  const toggleUserStatus = async (id, s) => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vault_users', id), { status: s === 'active' ? 'blocked' : 'active' });
  const deleteUser = async (id) => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vault_users', id));
  const nukeChain = async () => {
      if(!confirm("NUKE CHAIN? This is irreversible.")) return;
      const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'vault_chain'));
      snap.forEach(d => deleteDoc(d.ref));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 font-cyber animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-[85vh] bg-zinc-950 border border-zinc-800 rounded-lg flex overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 text-zinc-500 hover:text-white hover:bg-zinc-800 p-2 rounded-full transition-all"><X size={20} /></button>

        <div className="w-64 bg-black border-r border-zinc-800 p-6 flex flex-col hidden md:flex">
          <div className="flex items-center gap-3 text-green-500 mb-10">
            <Shield size={28} />
            <div>
                <h1 className="font-bold text-xl tracking-tighter leading-none">VAULT</h1>
                <div className="text-[10px] text-zinc-500 tracking-widest">SECURE NODE</div>
            </div>
          </div>
          {currentUser && (
             <div className="mb-8 p-4 bg-zinc-900/50 rounded border border-zinc-800">
                <div className="font-bold text-white truncate text-sm">{currentUser.username}</div>
                <div className={`text-[10px] font-bold uppercase mt-2 inline-flex px-2 py-0.5 rounded items-center gap-2 ${currentUser.role === 'admin' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
                    {currentUser.role}
                </div>
             </div>
          )}
          {currentUser && (
             <nav className="space-y-2 flex-1">
                <button onClick={() => setActiveTab('ledger')} className={`w-full text-left px-4 py-3 rounded text-xs font-bold tracking-wider transition-all flex items-center gap-3 ${activeTab === 'ledger' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
                    <Database size={14} /> LEDGER
                </button>
                {currentUser.role === 'admin' && (
                    <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded text-xs font-bold tracking-wider transition-all flex items-center gap-3 ${activeTab === 'users' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
                        <Server size={14} /> USERS
                    </button>
                )}
             </nav>
          )}
          {currentUser && (
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-400 text-xs font-bold mt-auto px-2"><LogOut size={14} /> DISCONNECT</button>
          )}
        </div>

        <div className="flex-1 flex flex-col relative bg-zinc-950/50">
          {view === 'login' && (
             <div className="flex-1 flex items-center justify-center p-8 relative">
                <div className="w-full max-w-sm space-y-6">
                   <h2 className="text-2xl font-bold text-white text-center tracking-tight">Access Node</h2>
                   <div className="space-y-4">
                      <input placeholder="USERNAME" className="w-full bg-black border border-zinc-800 p-4 text-sm text-white text-center tracking-widest outline-none focus:border-green-500" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                      <input type="password" placeholder="PASSPHRASE" className="w-full bg-black border border-zinc-800 p-4 text-sm text-white text-center tracking-widest outline-none focus:border-green-500" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                      <button onClick={handleLogin} disabled={loading} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 text-xs tracking-[0.2em] transition-colors">{loading ? 'DECRYPTING...' : 'CONNECT'}</button>
                   </div>
                   <div className="text-center"><button onClick={() => switchView('register')} className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest">Generate Identity</button></div>
                   {successMsg && <div className="text-green-400 text-xs text-center bg-green-900/20 p-3 border border-green-900/50 font-mono animate-pulse">{successMsg}</div>}
                   {error && <div className="text-red-500 text-xs text-center bg-red-900/10 p-3 border border-red-900/30 font-mono">{error}</div>}
                </div>
             </div>
          )}

          {view === 'register' && (
             <div className="flex-1 flex items-center justify-center p-8 relative">
                <div className="w-full max-w-sm space-y-6">
                   <h2 className="text-2xl font-bold text-white text-center tracking-tight">New Identity</h2>
                   <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="FULL NAME" className="w-full bg-black border border-zinc-800 p-3 text-xs text-white text-center outline-none focus:border-green-500" value={regForm.fullName} onChange={e => setRegForm({...regForm, fullName: e.target.value})} />
                        <input placeholder="ORG" className="w-full bg-black border border-zinc-800 p-3 text-xs text-white text-center outline-none focus:border-green-500" value={regForm.org} onChange={e => setRegForm({...regForm, org: e.target.value})} />
                      </div>
                      <input placeholder="USERNAME" className="w-full bg-black border border-zinc-800 p-3 text-xs text-white text-center outline-none focus:border-green-500" value={regForm.username} onChange={e => setRegForm({...regForm, username: e.target.value})} />
                      <input type="password" placeholder="PASSPHRASE" className="w-full bg-black border border-zinc-800 p-3 text-xs text-white text-center outline-none focus:border-green-500" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} />
                      <button onClick={handleRegister} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-4 text-xs tracking-[0.2em] mt-4">{loading ? 'GENERATING...' : 'COMMIT'}</button>
                   </div>
                   <div className="text-center"><button onClick={() => switchView('login')} className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest">Back to Login</button></div>
                </div>
             </div>
          )}

          {/* Dashboard Views (Ledger & Users) remain the same as in previous successful versions */}
          {view === 'dashboard' && activeTab === 'ledger' && (
             <div className="flex-1 flex flex-col h-full">
                <div className="pl-6 py-6 pr-24 border-b border-zinc-800 flex justify-between items-center bg-black/50">
                   <div className="flex items-center gap-3"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><h3 className="font-bold text-white text-sm tracking-widest">LIVE_LEDGER</h3></div>
                   {currentUser.role === 'admin' && <button onClick={() => nukeChain(true)} className="text-[10px] text-red-500 border border-red-900/50 px-3 py-1 hover:bg-red-900/20">NUKE CHAIN</button>}
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                   {chain.map((block) => (
                      <div key={block.id} className={`p-5 border transition-all ${block.decryptedContent ? 'bg-green-900/10 border-green-900/30' : 'bg-black border-zinc-800 opacity-60 hover:opacity-100'}`}>
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-mono bg-zinc-900 px-2 py-1 text-zinc-500">BLK_{block.index}</span>
                               <span className={`text-xs font-bold ${block.decryptedContent ? 'text-green-400' : 'text-white'}`}>{block.sender}</span>
                            </div>
                            <span className="text-[10px] text-zinc-600 font-mono">{block.timestamp?.toDate().toLocaleTimeString()}</span>
                         </div>
                         <div className="font-mono text-xs break-all leading-relaxed pl-2 border-l-2 border-zinc-800">
                            {block.decryptedContent ? (
                                <div className="flex flex-col gap-1">
                                    <span className="text-green-300">{block.decryptedContent.text}</span>
                                    {block.decryptSource === 'admin' && <span className="text-[9px] text-red-400 uppercase tracking-widest mt-1 flex items-center gap-1"><Unlock size={8} /> ADMIN_DECRYPT</span>}
                                </div>
                            ) : (
                                <span className="text-zinc-600 italic flex items-center gap-2"><Lock size={10}/> [ ENCRYPTED_PAYLOAD ]</span>
                            )}
                         </div>
                         {currentUser.role === 'admin' && <button onClick={() => deleteBlock(block.id)} className="text-red-500 hover:text-red-400 text-[10px] mt-3 flex items-center gap-1 uppercase tracking-wider"><Trash2 size={10}/> Prune</button>}
                      </div>
                   ))}
                   <div ref={chainEndRef} />
                </div>
                {currentUser.role !== 'admin' && (
                    <div className="p-4 border-t border-zinc-800 bg-black flex gap-0">
                        <input className="flex-1 bg-zinc-900 border-y border-l border-zinc-700 p-4 text-sm text-white outline-none focus:bg-zinc-800 font-mono" placeholder="> Encrypt data..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddBlock()} />
                        <button onClick={handleAddBlock} disabled={!msgInput.trim()} className="bg-white hover:bg-zinc-200 px-6 text-black border-y border-r border-zinc-700"><Plus size={20} /></button>
                    </div>
                )}
             </div>
          )}

          {view === 'dashboard' && activeTab === 'users' && currentUser.role === 'admin' && (
             <div className="flex-1 overflow-y-auto p-8 grid gap-4">
                <div className="flex justify-between items-end mb-8 pr-12">
                    <h2 className="text-xl font-bold text-white">User Directory</h2>
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">{usersList.length} Registered Identities</span>
                </div>
                <div className="grid gap-4">
                   {usersList.map(u => (
                      <div key={u.id} className="bg-black p-5 border border-zinc-800 flex justify-between items-center hover:border-zinc-600">
                         <div>
                            <div className="font-bold text-white text-sm">{u.username}</div>
                            <div className={`text-[9px] mt-1 inline-block px-2 py-0.5 uppercase ${u.status === 'blocked' ? 'bg-red-500 text-black' : 'bg-green-500 text-black'}`}>{u.status}</div>
                         </div>
                         <div className="flex gap-3">
                            <button onClick={() => toggleUserStatus(u.id, u.status)} className="p-2 border border-zinc-700 text-zinc-400 hover:text-white">{u.status === 'blocked' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}</button>
                            <button onClick={() => deleteUser(u.id)} className="p-2 border border-red-900 text-red-500 hover:bg-red-900/20"><Trash2 size={16}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecureVault;