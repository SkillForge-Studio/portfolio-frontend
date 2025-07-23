'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/client'

export const dynamic = 'force-dynamic'; // 🛡️ ключове

export default function AuthCallbackPage() {
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const redirect = urlParams.get('redirect') || '/'

        const error = urlParams.get('error')

        if (error) {
            router.replace(redirect) // Якщо авторизація не пройшла — просто назад
            return
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                router.replace(redirect)
            } else {
                router.replace(`/Auth?redirect=${redirect}`)
            }
        })
    }, [])

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '3rem 2.5rem',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #667eea',
                    borderTop: '4px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1.5rem auto'
                }}></div>

                <p style={{
                    color: '#555',
                    fontSize: '1.1rem',
                    margin: 0
                }}>
                    Зачекайте, виконується авторизація...
                </p>
            </div>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}