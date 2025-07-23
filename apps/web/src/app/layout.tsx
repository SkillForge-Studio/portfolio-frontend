import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import React, { Suspense } from "react";
// import { usePathname } from 'next/navigation'
import ClientNavigation from "@/app/components/ClientNavigation"
import DynamicFooter from "@/app/components/DynamicFooter";
import NavMenu from "@/app/components/NavMenu";
// import ServerNavigation from "@/app/components/ServerNavigation";


export const metadata: Metadata = {
    title: 'SkillForge - Портфоліо',
    description: 'Макет з Header/Main/Footer',
};

// Review this decision
// export const dynamic = 'force-dynamic'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="uk">
        <body style={{ overscrollBehaviorY: "none" }}>
        <header style={{
            position: 'fixed',
            margin: '0 auto',
            width: '100%',
            height: '66px',
            top: 0,
            left: 0,
            right: 0,
            background: '#ffffff',
            borderBottom: '1px solid #e0e0e0',
            zIndex: 1000
        }}>
            <div style={{
                maxWidth: '1400px',
                height: '100%',
                margin: '0 auto',
                padding: '0 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                    <Link href="/" style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        textDecoration: 'none',
                        color: '#171717',
                    }}>
                        SkillForge
                    </Link>
                    <NavMenu />
                </div>

                {/*<ServerNavigation />*/}
                <Suspense fallback={<div>Loading...</div>}>
                    <ClientNavigation />
                </Suspense>
            </div>
        </header>

        <main>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '0 20px'
            }}>
                {children}
            </div>
        </main>

        <Suspense fallback={null}>
            <DynamicFooter />
        </Suspense>
        </body>
        </html>
    );
}