import './globals.css';
import type { Metadata } from 'next';
import React from "react";

export const metadata: Metadata = {
    title: 'SkillForge - Портфоліо',
    description: 'Макет з Header/Main/Footer',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="uk">
        <body style={{
            overscrollBehaviorY: "none",
        }}>
        <header style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#ffffff',
        }}>
            <div style={{
            borderBottom: '1px solid #e0e0e0',
            padding: '1rem 2rem',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold'
            }}>SkillForge</div>
            <nav>
                <ul style={{
                    display: 'flex',
                    listStyle: 'none',
                    gap: '2rem',
                    margin: 0,
                    padding: 0
                }}>
                    <li><a href="#home" style={{
                        textDecoration: 'none',
                        color: '#171717',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.3s'
                    }}>Головна</a></li>
                    <li><a href="#projects" style={{
                        textDecoration: 'none',
                        color: '#171717',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.3s'
                    }}>Проекти</a></li>
                    <li><a href="#skills" style={{
                        textDecoration: 'none',
                        color: '#171717',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.3s'
                    }}>Навички</a></li>
                    <li><a href="#contact" style={{
                        textDecoration: 'none',
                        color: '#171717',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.3s'
                    }}>Roadmap</a></li>
                    <li><a href="#contact" style={{
                        textDecoration: 'none',
                        color: '#171717',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.3s'
                    }}>Контакти</a></li>
                    <li><a href="/test-connection" style={{
                        textDecoration: 'none',
                        color: '#ff6b35',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.3s',
                        border: '1px solid #ff6b35'
                    }}>Test DB</a></li>
                </ul>
            </nav>

            <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
            }}>
                <button style={{
                    background: 'transparent',
                    border: '1px solid #e0e0e0',
                    color: '#171717',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s'
                }}>Увійти</button>
                <button style={{
                    background: '#171717',
                    border: '1px solid #171717',
                    color: '#ffffff',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s'
                }}>Реєстрація</button>
                </div>
            </div>
        </header>
        <main>
            {children}
        </main>
        <footer style={{
            background: '#ffffff',
            borderTop: '1px solid #e0e0e0',
            padding: '3rem 1rem',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: '2rem'
            }}>
                {/* Left section: About */}
                <div style={{ flex: '1 1 250px' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Проєкт</h3>
                    <p style={{ lineHeight: '1.6' }}>
                        SkillForge — платформа для демонстрації технічних навичок та креативного підходу до розробки. <br />
                        Made with love & curiosity.
                    </p>
                </div>

                {/* Middle section: Contacts */}
                <div style={{ flex: '1 1 200px' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Зв&#39;язок</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <a href="https://t.me/yourusername" target="_blank" rel="noopener noreferrer" title="Telegram">
                            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg" alt="Telegram" style={{ width: '24px', height: '24px' }} />
                        </a>
                        <a href="mailto:yourname@gmail.com" title="Viber">
                            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/viber.svg" alt="Viber" style={{ width: '24px', height: '24px' }} />
                        </a>
                        <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" title="GitHub">
                            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg" alt="GitHub" style={{ width: '24px', height: '24px' }} />
                        </a>
                        <a href="https://discord.com/users/yourusername" target="_blank" rel="noopener noreferrer" title="Discord">
                            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg" alt="Discord" style={{ width: '24px', height: '24px' }} />
                        </a>
                    </div>
                </div>

                {/* Right section: Legal or links */}
                <div style={{ flex: '1 1 150px' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Навігація</h3>
                    <ul style={{ listStyle: 'none', padding: 0, lineHeight: '1.8' }}>
                        <li><a href="/#projects">Проєкти</a></li>
                        <li><a href="/#skills">Навички</a></li>
                        <li><a href="/#contact">Контакти</a></li>
                    </ul>
                </div>
            </div>

            {/* Bottom copyright */}
            <div style={{
                textAlign: 'center',
                marginTop: '2rem',
                fontSize: '0.875rem',
                color: '#777'
            }}>
                <p>© 2025 SkillForge. Всі права захищені.</p>
            </div>
        </footer>

        </body>
        </html>
    );
}