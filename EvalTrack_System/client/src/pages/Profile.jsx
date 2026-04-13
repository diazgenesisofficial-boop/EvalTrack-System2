import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    User, 
    GraduationCap, 
    Lock,
    Shield,
    Mail,
    Info
} from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();

    return (
        <div className="profile-content animate-in fade-in duration-500">
            <div className="ph">
                <div>
                    <div className="ph-title text-black">Academic Profile</div>
                    <div className="ph-sub">Your student records — managed by the Program Registry</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px]">
                {/* Account Details */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px' }}>
                    <div className="card-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User size={20} className="text-p500" /> Account Details
                    </div>
                    
                    <div className="field">
                        <div className="field-label" style={{ fontWeight: '800', color: 'var(--g400)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Full Name</div>
                        <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--g900)', marginTop: '6px' }}>{user?.name || '—'}</div>
                    </div>

                    <div className="field">
                        <div className="field-label" style={{ fontWeight: '800', color: 'var(--g400)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Student ID</div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--p500)', marginTop: '6px' }}>{user?.id || '—'}</div>
                    </div>

                    <div className="field">
                        <div className="field-label" style={{ fontWeight: '800', color: 'var(--g400)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Institutional Email</div>
                        <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--g600)', marginTop: '6px' }}>{user?.email || '—'}</div>
                    </div>
                </div>

                {/* Academic Info */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px' }}>
                    <div className="card-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <GraduationCap size={20} className="text-mag" /> Academic Info
                    </div>

                    <div className="field">
                        <div className="field-label" style={{ fontWeight: '800', color: 'var(--g400)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Enrolled Program</div>
                        <select className="fc" disabled value={user?.program || 'BSIT'} style={{ marginTop: '8px', cursor: 'not-allowed', background: 'var(--g50)' }}>
                            <option value="BSIT">Bachelor of Science in Information Technology</option>
                            <option value="BSEMC">Bachelor of Science in Entertainment and Multimedia Computing</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="field-label" style={{ fontWeight: '800', color: 'var(--g400)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Current Year Level</div>
                        <select className="fc" disabled value={user?.year_level || '1'} style={{ marginTop: '8px', cursor: 'not-allowed', background: 'var(--g50)' }}>
                            <option value="1">1st Year Undergraduate</option>
                            <option value="2">2nd Year Undergraduate</option>
                            <option value="3">3rd Year Undergraduate</option>
                            <option value="4">4th Year Undergraduate</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="field-label" style={{ fontWeight: '800', color: 'var(--g400)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Student Classification</div>
                        <select className="fc" disabled value={user?.student_type || 'regular'} style={{ marginTop: '8px', cursor: 'not-allowed', background: 'var(--g50)' }}>
                            <option value="regular">Regular Student</option>
                            <option value="irregular">Irregular / Returning</option>
                            <option value="transferee">Transferee</option>
                        </select>
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        padding: '14px', 
                        background: 'rgba(124, 58, 237, 0.04)', 
                        border: '1px solid rgba(124, 58, 237, 0.1)', 
                        borderRadius: '12px',
                        alignItems: 'flex-start'
                    }}>
                        <Lock size={16} className="text-p500" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontSize: '11.5px', color: 'var(--g500)', lineHeight: '1.5', fontWeight: '600' }}>
                            Profile attributes are locked. Changes must be requested through the Program Head or IT Registrar.
                        </span>
                    </div>
                </div>
            </div>

            {/* Account Security */}
            <div className="card" style={{ marginTop: '24px', maxWidth: '800px', padding: '32px' }}>
                <div className="card-hd" style={{ padding: 0, border: 0, marginBottom: '24px' }}>
                    <div className="card-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield size={20} className="text-teal" /> Account Security
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost" style={{ padding: '12px 24px' }}>
                        <Lock size={16} /> Update Password
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '12px 24px' }}>
                        <Shield size={16} /> Two-Factor Authentication
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
