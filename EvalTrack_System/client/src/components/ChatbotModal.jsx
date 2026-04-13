import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Send, Cpu, AlertCircle, Loader2 } from 'lucide-react';

const ChatbotModal = ({ isOpen, onClose, title, introMessage }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const tryParseAiJson = (raw) => {
        if (typeof raw !== 'string') return null;
        const t = raw.trim();
        if (!t.startsWith('{')) return null;
        try {
            return JSON.parse(t);
        } catch (e) {
            return null;
        }
    };

    const formatCurriculumJsonForChat = (payload) => {
        // payload is expected to follow promt.md JSON contract
        const report = payload?.report;
        const rec = payload?.recommendation;
        if (!report || !rec) return null;

        const h = report.student_header || {};
        const standing = report.summary_remarks?.current_standing || 'N/A';

        const gradeRows = Array.isArray(report.grade_table) ? report.grade_table : [];
        const gradePreview = gradeRows
            .slice(0, 8)
            .map((r, i) => {
                const code = r.subject_code || 'N/A';
                const title = r.subject_title || '';
                const units = r.units !== undefined && r.units !== null ? r.units : 'N/A';
                const grade = r.grade !== undefined && r.grade !== null ? r.grade : 'N/A';
                const status = r.status || 'N/A';
                return `${i + 1}. ${code}${title ? ' - ' + title : ''} | Units: ${units} | Grade: ${grade} | ${status}`;
            })
            .join('\n');

        const eligible = rec.next_semester?.eligible_subjects || [];
        const notEligible = rec.next_semester?.not_eligible_subjects || [];
        const needsReview = rec.next_semester?.needs_review || [];

        const eligiblePreview = eligible.length
            ? eligible.slice(0, 10).map(s => `${s.code}${s.title ? ' - ' + s.title : ''}`).join('\n')
            : 'None';
        const notEligiblePreview = notEligible.length
            ? notEligible.slice(0, 10).map(s => `${s.code}${s.title ? ' - ' + s.title : ''}`).join('\n')
            : 'None';

        const needsReviewPreview = needsReview.length
            ? needsReview.slice(0, 5).map(s => `${s.code || 'N/A'}: ${s.reason || 'Needs review'}`).join('\n')
            : '';

        const target = rec.next_semester?.target_semester || 'N/A';
        const add = rec.enrollment_process?.add_drop_plan?.add || [];
        const drop = rec.enrollment_process?.add_drop_plan?.drop || [];

        const addPreview = add.length ? add.map(x => `${x.code}${x.title ? ' - ' + x.title : ''}`).join('\n') : 'None';
        const dropPreview = drop.length ? drop.map(x => `${x.code}${x.title ? ' - ' + x.title : ''}`).join('\n') : 'None';

        const emailDraft = payload?.email?.subject ? `\n\nEmail Draft:\nSubject: ${payload.email.subject}` : '';

        return [
            `ACADEMIC PROGRESS REPORT (BSIT)`,
            `Student: ${h.student_name || 'N/A'} (${h.student_id || 'N/A'})`,
            `Program: ${h.program || 'BSIT'} | Year Level: ${h.year_level || 'N/A'} | Semester: ${h.semester || 'N/A'}`,
            `Current Standing: ${standing}`,
            ``,
            `Grade Table (preview):`,
            gradePreview || 'No grade rows provided.',
            ``,
            `Next Semester Recommendation: ${target}`,
            `Eligible:`,
            eligiblePreview,
            ``,
            `Not Eligible:`,
            notEligiblePreview,
            ...(needsReviewPreview ? [``, `Needs Review:`, needsReviewPreview] : []),
            ``,
            `Enrollment Process (Add/Drop):`,
            `Add (Eligible):`,
            addPreview,
            ``,
            `Drop (Not Eligible):`,
            dropPreview,
            emailDraft
        ].join('\n');
    };

    const downloadHtmlReport = (html, filename) => {
        if (!html) return;
        const safeName = (filename && filename.trim()) ? filename.trim() : 'academic_report.html';
        const normalized = safeName.toLowerCase().endsWith('.html') ? safeName : safeName.replace(/\.pdf$/i, '.html');
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = normalized;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            setMessages([{ role: 'bot', content: introMessage || 'Hello! How can I help you today?' }]);
        }
    }, [isOpen, introMessage]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!isOpen) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || loading) return;

        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/ai/chat', {
                topic: title,
                query: text
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const parsed = tryParseAiJson(res.data?.reply);
            if (parsed) {
                const formatted = formatCurriculumJsonForChat(parsed);
                const reportHtml = parsed?.report?.pdf_ready_html;
                const reportFilename = parsed?.report?.pdf_download_filename;
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'bot',
                        content: formatted || res.data.reply,
                        reportHtml,
                        reportFilename
                    }
                ]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', content: res.data.reply }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { 
                role: 'bot', 
                content: 'Sorry, I am having trouble connecting to the AI service. Please check your internet or try again later.',
                error: true 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-p900 w-full max-w-lg h-[600px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-[#4a148c] to-[#7b1fa2] text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Cpu size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-lg leading-tight">{title || 'AI Assistant'}</h3>
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Online</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#f8f9fa]">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                                m.role === 'user' 
                                ? 'bg-[#ab47bc] text-white rounded-br-none shadow-lg shadow-[#ab47bc]/20' 
                                : m.error 
                                    ? 'bg-red-50 text-red-600 border border-red-100 flex items-center gap-2'
                                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                            }`}>
                                {m.role === 'bot' && !m.error && (
                                    <div className="text-[10px] font-black text-[#4a148c] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <Cpu size={12} /> EvalTrack AI
                                    </div>
                                )}
                                {m.error && <AlertCircle size={14} />}
                                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                                {m.reportHtml && (
                                    <div style={{ marginTop: 12 }}>
                                        <button
                                            type="button"
                                            onClick={() => downloadHtmlReport(m.reportHtml, m.reportFilename)}
                                            className="px-3 py-2 text-xs font-black rounded-xl bg-p500 text-white hover:bg-p800 transition-all"
                                        >
                                            Download Report (HTML)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 text-gray-500 p-4 rounded-2xl rounded-bl-none text-sm font-medium flex items-center gap-3">
                                <Loader2 size={16} className="animate-spin" />
                                <span>AI is thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-6 border-t dark:border-white/10 bg-gray-50 dark:bg-black/20 flex gap-3">
                    <input 
                        type="text" 
                        placeholder="Ask me anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 px-5 py-3.5 bg-white dark:bg-white/5 border border-transparent focus:border-p500 rounded-2xl text-sm font-medium focus:outline-none transition-all"
                    />
                    <button 
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="w-12 h-12 bg-p500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-p500/30 hover:bg-p800 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatbotModal;
