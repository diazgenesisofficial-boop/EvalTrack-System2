import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
    Send, 
    Inbox, 
    User, 
    MessageSquare, 
    Search, 
    Loader2, 
    Calendar, 
    ChevronRight, 
    Search as SearchIcon,
    Plus,
    Paperclip
} from 'lucide-react';

const Messages = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inbox');
    const [showComposer, setShowComposer] = useState(false);
    
    const [recipientId, setRecipientId] = useState('');
    const [subject, setSubject] = useState('');
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // PHP-style session auth - no JWT token needed
            const [msgRes, userRes] = await Promise.all([
                axios.get('http://localhost:5000/api/messages'),
                axios.get('http://localhost:5000/api/auth/users')
            ]);
            // Backend returns array directly (PHP-style)
            setMessages(Array.isArray(msgRes.data) ? msgRes.data : []);
            const allUsers = Array.isArray(userRes.data) ? userRes.data : [];
            setUsers(allUsers.filter(u => u.id !== user.id));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!recipientId || !messageText) return;

        setIsSending(true);
        try {
            // PHP-style session auth - no JWT token needed
            await axios.post('http://localhost:5000/api/messages', {
                receiver_id: recipientId,
                subject: subject || 'No Subject',
                message_text: messageText
            });
            
            setSubject('');
            setMessageText('');
            setShowComposer(false);
            fetchData();
            alert('Message Sent!');
        } catch (err) {
            console.error(err);
            alert('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="messages-content animate-in fade-in duration-500">
            <div className="ph" style={{ marginBottom: '24px' }}>
                <div>
                    <div className="ph-title">Admin Messages</div>
                    <div className="ph-sub">Real-time communication with the Dean and Admin</div>
                </div>
            </div>

            <div className="flex gap-6 h-[calc(100vh-240px)]">
                {/* Sidebar */}
                <div className="w-80 flex flex-col bg-white rounded-[24px] shadow-sm overflow-hidden border border-gray-100">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Direct Messages</h3>
                        <button 
                            onClick={() => setShowComposer(!showComposer)}
                            className="w-8 h-8 rounded-lg bg-p50 text-p500 flex items-center justify-center hover:bg-p500 hover:text-white transition-all"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-p500" /></div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Inbox className="mx-auto mb-2 opacity-20" size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest">No users found</p>
                            </div>
                        ) : (
                            users.map(u => (
                                <div 
                                    key={u.id}
                                    style={{ 
                                        padding: '12px', borderRadius: '16px', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    className="hover:bg-gray-50 group flex items-center gap-3"
                                    onClick={() => {
                                        setRecipientId(u.id);
                                        setShowComposer(true);
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-full bg-p50 text-p500 flex items-center justify-center font-black text-sm">
                                        {u.name.charAt(0).toUpperCase()}
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div className="flex-1 min-width-0">
                                        <div className="text-sm font-black text-gray-900 truncate">{u.name}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate">
                                            {u.role === 'admin' ? 'Administrative Dean' : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-[24px] shadow-sm overflow-hidden border border-gray-100 flex flex-col">
                    {showComposer ? (
                        <div className="flex-1 flex flex-col">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="font-black text-lg text-gray-900">New Message</h3>
                            </div>
                            
                            <form onSubmit={handleSendMessage} className="flex-1 flex flex-col p-8 gap-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="field">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Recipient</label>
                                        <select 
                                            value={recipientId}
                                            onChange={(e) => setRecipientId(e.target.value)}
                                            className="fc"
                                        >
                                            <option value="">Select Recipient...</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                        </select>
                                    </div>

                                    <div className="field">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Subject</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Schedule Inquiry"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="fc"
                                        />
                                    </div>
                                </div>

                                <div className="field flex-1 flex flex-col">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Message Content</label>
                                    <textarea 
                                        placeholder="Type your message here..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        className="fc flex-1 resize-none p-6"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <button type="button" className="p-3 text-gray-400 hover:text-p500 transition-all">
                                        <Paperclip size={20} />
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isSending}
                                        className="btn btn-primary px-10 py-4"
                                    >
                                        {isSending ? 'Sending...' : <><Send size={18} className="mr-2" /> Send Message</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-24 h-24 rounded-[32px] bg-p50 text-p500 flex items-center justify-center mb-8">
                                <MessageSquare size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Your Workspace Messages</h3>
                            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                                Select an administrator or colleague from the left to view your secure message history.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
