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
    const [isLoading, setIsLoading] = useState(false)

    const mode = searchParams.get('mode')
    const [isLogin, setIsLogin] = useState(mode !== 'register')

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [passwordRules, setPasswordRules] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
    })

    useEffect(() => {
        const currentMode = searchParams.get('mode')
        setIsLogin(currentMode !== 'register')
    }, [searchParams])

    const handlePasswordChange = (value: string) => {
        setPassword(value)
        setPasswordRules({
            length: value.length >= 12,
            lowercase: /[a-z]/.test(value),
            uppercase: /[A-Z]/.test(value),
            number: /[0-9]/.test(value),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        })
    }

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                router.replace(redirectTo)
                router.refresh()
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase.auth, router, redirectTo])

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                router.replace(redirectTo)
            }
        })
    }, [supabase.auth, router, redirectTo])

    // Покращена валідація паролю з додатковою безпекою
    const passwordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{12,}$/.test(password)

    const handleAuth = async () => {
        setError('')
        setSuccess('')
        setIsLoading(true)

        // Базова валідація
        if (!email || !password) {
            setError('Введіть email і пароль.')
            setIsLoading(false)
            return
        }

        // Валідація email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('Введіть коректний email.')
            setIsLoading(false)
            return
        }

        if (!isLogin) {
            if (password !== confirmPassword) {
                setError('Паролі не співпадають.')
                setIsLoading(false)
                return
            }

            if (!passwordValid) {
                setError('Пароль не відповідає всім вимогам безпеки.')
                setIsLoading(false)
                return
            }
        }

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: email.trim().toLowerCase(),
                    password
                })

                if (error) {
                    // Обробка специфічних помилок
                    switch (error.message) {
                        case 'Invalid login credentials':
                            setError('Невірний email або пароль.')
                            break
                        case 'Email not confirmed':
                            setError('Підтвердьте свій email перед входом.')
                            break
                        case 'Too many requests':
                            setError('Занадто багато спроб. Спробуйте пізніше.')
                            break
                        default:
                            setError('Помилка входу. Перевірте дані.')
                    }
                } else {
                    setSuccess('Успішно увійшли!')
                    setTimeout(() => {
                        router.replace(redirectTo)
                        router.refresh()
                    }, 1000)
                }
            } else {
                const { error } = await supabase.auth.signUp({
                    email: email.trim().toLowerCase(),
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
                    }
                })

                if (error) {
                    switch (error.message) {
                        case 'User already registered':
                            setError('Користувач з таким email вже існує.')
                            break
                        case 'Password should be at least 6 characters':
                            setError('Пароль має бути не менше 6 символів.')
                            break
                        default:
                            setError('Помилка реєстрації. Спробуйте ще раз.')
                    }
                } else {
                    setSuccess('Реєстрація успішна! Перевірте email для підтвердження.')
                }
            }
        } catch (err) {
            console.error('Auth error:', err)
            setError('Щось пішло не так. Спробуйте пізніше.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOAuthSignIn = async (provider: 'google' | 'github') => {
        setError('')
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
                }
            })

            if (error) {
                setError(`Помилка входу через ${provider}. Спробуйте ще раз.`)
            }
        } catch (err) {
            setError('Помилка OAuth авторизації.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleBack = () => router.push(redirectTo)

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
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
                        onClick={() => handleOAuthSignIn('google')}
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