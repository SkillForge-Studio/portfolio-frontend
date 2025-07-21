'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@supabase/client'

export function AuthPageContent() {
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()

    const redirectTo = searchParams.get('redirect') || '/'

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                router.replace(redirectTo)
            }
        })
    }, [])

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/Auth/callback?redirect=${redirectTo}`,
            },
        })
    }

    const handleEmailLogin = async () => {
        const email = prompt('Введіть вашу пошту:')
        if (email) {
            await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/Auth/callback?redirect=${redirectTo}`,
                },
            })
            alert('Перевірте пошту для входу')
        }
    }

    const handleBack = () => {
        router.push(redirectTo)
    }

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                }}
            >
                <h1
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: '1rem',
                        textAlign: 'center',
                    }}
                >
                    Увійти або зареєструватися
                </h1>

                <button
                    onClick={handleGoogleLogin}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                    Google логін
                </button>

                <button
                    onClick={handleEmailLogin}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#111827',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#000')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#111827')}
                >
                    Email логін
                </button>

                <button
                    onClick={handleBack}
                    style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        marginTop: '0.5rem',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                    ⬅ Назад
                </button>
            </div>
        </div>
    )
}