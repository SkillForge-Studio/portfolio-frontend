import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import React, { Suspense } from "react";
// import { usePathname } from 'next/navigation'
import ClientNavigation from "@/app/components/ClientNavigation"
import DynamicFooter from "@/app/components/DynamicFooter";

export const metadata: Metadata = {
    title: 'SkillForge - Портфоліо',
    description: 'Макет з Header/Main/Footer',
};

// Review this decision
// export const dynamic = 'force-dynamic'


export default function RootLayout({ children, }: {
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
                        <li><Link href="/#home" style={{
                            textDecoration: 'none',
                            color: '#171717',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            transition: 'background-color 0.3s'
                        }}>Головна</Link></li>
                        <li><Link href="/#projects" style={{
                            textDecoration: 'none',
                            color: '#171717',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            transition: 'background-color 0.3s'
                        }}>Проекти</Link></li>
                        <li><Link href="/#skills" style={{
                            textDecoration: 'none',
                            color: '#171717',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            transition: 'background-color 0.3s'
                        }}>Навички</Link></li>
                        <li><Link href="/#roadmap" style={{
                            textDecoration: 'none',
                            color: '#171717',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            transition: 'background-color 0.3s'
                        }}>Roadmap</Link></li>
                        <li><Link href="/#contact" style={{
                            textDecoration: 'none',
                            color: '#171717',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            transition: 'background-color 0.3s'
                        }}>Контакти</Link></li>
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
                <Suspense fallback={<div>Loading...</div>}>
                    <ClientNavigation />
                </Suspense>
            </div>
        </header>
        <main>
            {children}
        </main>
        <Suspense fallback={null}>
            <DynamicFooter />
        </Suspense>

        </body>
        </html>
    );
}