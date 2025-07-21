'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/client';

export default function ClientNavigation() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';

    const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) {
                const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || null;
                setUser({ email: data.user.email, full_name: fullName });
            }
        });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.refresh(); // Оновлює компонент (можна також router.push('/'))
    };

    if (user) {
        return (
            <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '0.9rem' }}>Привіт, <strong>{user.full_name || user.email}</strong></span>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'transparent',
                        border: '1px solid #e0e0e0',
                        color: '#171717',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s'
                    }}
                >
                    Вийти
                </button>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
        }}>
            <button
                onClick={() => router.push(`/Auth?mode=login&redirect=${encodeURIComponent(redirect)}`)}
                style={{
                    background: 'transparent',
                    border: '1px solid #e0e0e0',
                    color: '#171717',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s'
                }}
            >
                Увійти
            </button>
            <button
                onClick={() => router.push(`/Auth?mode=register&redirect=${encodeURIComponent(redirect)}`)}
                style={{
                    background: '#171717',
                    border: '1px solid #171717',
                    color: '#ffffff',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s'
                }}
            >
                Реєстрація
            </button>
        </div>
    );
}