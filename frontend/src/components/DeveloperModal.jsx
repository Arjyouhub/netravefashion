import React from 'react';

export default function DeveloperModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }}>
            <div className="modal-content checkout-modal-content" style={{ maxWidth: '480px', padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '16px', background: '#090d16' }}>
                
                {/* Header Banner */}
                <div style={{ 
                    height: '100px', 
                    background: 'linear-gradient(135deg, var(--primary), #d97706)',
                    position: 'relative' 
                }}>
                    <button className="close-btn modal-close" onClick={onClose} style={{ color: '#fff', top: '15px', right: '15px' }}>&times;</button>
                </div>

                {/* Developer Profile Card */}
                <div style={{ padding: '30px', textAlign: 'center', marginTop: '-50px', position: 'relative' }}>
                    {/* Avatar Circle */}
                    <div style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        background: '#1e293b',
                        border: '4px solid #090d16',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                        <svg viewBox="0 0 24 24" style={{ width: '48px', height: '48px', fill: 'var(--primary)' }}>
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>

                    <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: '0 0 4px' }}>
                        Arjyou Hub
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 20px' }}>
                        Full-Stack Web Developer
                    </p>

                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 24px' }}>
                        Specializing in modern React.js interfaces, Node.js backends, Express APIs, and high-performance MongoDB Atlas database cloud integrations. Designed and built the e-commerce infrastructure for Netrave Clothing.
                    </p>

                    {/* Tech Stack Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '30px' }}>
                        {['React.js', 'Node.js', 'Express.js', 'MongoDB Atlas', 'Vite', 'REST API', 'Git & GitHub'].map(tech => (
                            <span key={tech} style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '600',
                                background: '#1e293b',
                                color: '#cbd5e1',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                {tech}
                            </span>
                        ))}
                    </div>

                    {/* Social / Contact Links */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <a 
                            href="https://github.com/Arjyouhub" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="cta-btn primary-cta" 
                            style={{ 
                                flex: 1, 
                                justifyContent: 'center',
                                padding: '10px 16px',
                                fontSize: '13px',
                                textDecoration: 'none'
                            }}
                        >
                            Visit GitHub Profile
                        </a>
                        <button 
                            onClick={onClose}
                            className="cta-btn secondary-cta" 
                            style={{ 
                                flex: 1, 
                                justifyContent: 'center',
                                padding: '10px 16px',
                                fontSize: '13px'
                            }}
                        >
                            Return to Store
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
