import './globals.css';
import type { Metadata } from 'next';
import React from "react";

export const metadata: Metadata = {
    title: 'SkillProve - Портфоліо',
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
            }}>SkillProve</div>
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
                    }}>Контакти</a></li>
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
            padding: '2rem',
            textAlign: 'center'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <div style={{
                    marginBottom: '1rem'
                }}>
                    <h3 style={{
                        marginBottom: '0.5rem'
                    }}>Про мене</h3>
                    <p>Коротка інформація про мене та мої професійні інтереси.</p>
                </div>
                <div>
                    <p>© 2025 SkillProve. Всі права захищено.</p>
                </div>
            </div>
        </footer>
        </body>
        </html>
    );
}