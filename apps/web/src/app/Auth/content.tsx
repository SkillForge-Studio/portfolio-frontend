'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/client'

export function AuthPageContent() {
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect') || '/'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState('')

    const [passwordRules, setPasswordRules] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
    })

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setPasswordRules({
            length: value.length >= 12,
            lowercase: /[a-z]/.test(value),
            uppercase: /[A-Z]/.test(value),
            number: /[0-9]/.test(value),
        });
    };

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                router.replace(redirectTo) // можна додати router.refresh() якщо в Next 13+ App Router
            }
        })

        // cleanup
        return () => {
            subscription.unsubscribe()
        }
    }, [])



    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                router.replace(redirectTo)
            }
        })
    }, [])

    const passwordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/.test(password)

    const handleAuth = async () => {
        setError('')

        if (!email || !password) {
            setError('Введіть email і пароль.')
            return
        }

        if (!isLogin) {
            if (password !== confirmPassword) {
                setError('Паролі не співпадають.')
                return
            }

            if (!passwordValid) {
                setError('Пароль не відповідає вимогам.')
                return
            }
        }

        try {
            const { error } = isLogin
                ? await supabase.auth.signInWithPassword({ email, password })
                : await supabase.auth.signUp({ email, password })

            if (error) {
                setError(error.message)
            } else {
                router.replace(redirectTo)
            }
        } catch (err) {
            setError('Щось пішло не так.')
        }
    }

    const handleBack = () => router.push(redirectTo)

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)'}}>
            <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
                    {isLogin ? 'Вхід' : 'Реєстрація'}
                </h1>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />

                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />

                {!isLogin && (
                    <input
                        type="password"
                        placeholder="Підтвердьте пароль"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                    />
                )}

                {!isLogin && (
                    <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                        <p style={{ color: passwordRules.length ? 'green' : '#9ca3af' }}>• Мінімум 12 символів</p>
                        <p style={{ color: passwordRules.lowercase ? 'green' : '#9ca3af' }}>• Мала літера (a-z)</p>
                        <p style={{ color: passwordRules.uppercase ? 'green' : '#9ca3af' }}>• Велика літера (A-Z)</p>
                        <p style={{ color: passwordRules.number ? 'green' : '#9ca3af' }}>• Цифра (0-9)</p>
                    </div>
                )}

                {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <button
                        onClick={async () => {
                            const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
                            if (error) setError(error.message)
                        }}
                        style={{ width: '48px', height: '48px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        aria-label="Google Sign In"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="24" height="24" />
                    </button>
                </div>

                <button
                    onClick={handleAuth}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '0.5rem' }}
                >
                    {isLogin ? 'Увійти' : 'Зареєструватися'}
                </button>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    style={{ width: '100%', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {isLogin ? 'Немає акаунту? Зареєструйтесь' : 'Вже є акаунт? Увійти'}
                </button>

                <button
                    onClick={handleBack}
                    style={{ width: '100%', padding: '0.65rem', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '1rem', cursor: 'pointer' }}
                >
                    ⬅ Назад
                </button>
            </div>
        </div>
    )
}