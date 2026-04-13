import React, { useState } from 'react';
import { Sparkle, FileText, Zap } from 'lucide-react';
import ChatbotModal from '../components/ChatbotModal';

const Exams = () => {
    const [chatbotOpen, setChatbotOpen] = useState(false);

    return (
        <div className="exams-content animate-in fade-in duration-500">
            <div className="ph">
                <div>
                    <div className="ph-title text-black">AI Exam & Quiz Generator</div>
                    <div className="ph-sub">Generate structured assessments from your curriculum topics</div>
                </div>
            </div>

            <div className="card shadow-2xl hover:shadow-p500/20 transition-all duration-500" style={{ 
                padding: '80px 40px', 
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(32px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                borderRadius: '40px',
                marginTop: '32px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08), transparent 70%)', pointerEvents: 'none' }}></div>
                
                <div style={{ width: '100px', height: '100px', borderRadius: '32px', background: 'linear-gradient(135deg, var(--p500), var(--mag))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 20px 40px rgba(124, 58, 237, 0.2)' }} className="animate-bounce-slow">
                    <Zap size={48} />
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--g900)', marginBottom: '16px', letterSpacing: '-0.03em' }}>AI Engine: Active & Ready</h2>
                <p style={{ fontSize: '16px', color: 'var(--g500)', maxWidth: '520px', margin: '0 auto 48px', lineHeight: '1.8' }}>
                    Generate professional-grade assessments in seconds. Our AI analyzes your curriculum data to create valid, error-free quizzes, multiple-choice exams, and detailed grading rubrics.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button 
                        onClick={() => setChatbotOpen(true)}
                        className="btn btn-primary" 
                        style={{ padding: '20px 60px', fontSize: '16px', borderRadius: '20px', boxShadow: '0 15px 30px rgba(124, 58, 237, 0.4)' }}
                    >
                        <Zap size={20} style={{ marginRight: '12px' }} /> Launch Exam Generator
                    </button>
                </div>
            </div>

            <ChatbotModal 
                isOpen={chatbotOpen}
                onClose={() => setChatbotOpen(false)}
                title="Exam & Quiz Bot"
                introMessage="Hello Instructor! I can generate quizzes, multiple-choice tests, fill-in-the-blank sets, and rubrics. What topic or subject would you like to create an exam for?"
            />
        </div>
    );
};

export default Exams;
