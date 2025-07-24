'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Типи для валідації
interface AuthFormData {
    email: string
    password: string
}

interface AuthResponse {
    success: boolean
    error?: string
    message?: string
}

// Константи для валідації
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 12
const MAX_PASSWORD_LENGTH = 128
const MAX_EMAIL_LENGTH = 254

// Функції валідації
const validateEmail = (email: string): string | null => {
    if (!email.trim()) return 'Email є обов\'язковим'
    if (email.length > MAX_EMAIL_LENGTH) return 'Email занадто довгий'
    if (!EMAIL_REGEX.test(email)) return 'Невірний формат email'
    return null
}

const validatePassword = (password: string): string | null => {
    if (!password) return 'Пароль є обов\'язковим'
    if (password.length < MIN_PASSWORD_LENGTH) return `Пароль повинен містити мінімум ${MIN_PASSWORD_LENGTH} символів`
    if (password.length > MAX_PASSWORD_LENGTH) return 'Пароль занадто довгий'
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return 'Пароль повинен містити принаймні одну велику літеру, одну малу літеру та одну цифру'
    }
    return null
}

// Sanitize функція для очищення введених даних
const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '')
}

export default function AuthPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<{email?: string, password?: string}>({})

    // Валідація в реальному часі
    const validateField = useCallback((field: 'email' | 'password', value: string) => {
        let error: string | null = null

        if (field === 'email') {
            error = validateEmail(value)
        } else if (field === 'password') {
            error = validatePassword(value)
        }

        setFieldErrors(prev => ({
            ...prev,
            [field]: error
        }))

        return error === null
    }, [])

    // Обробники змін input-ів з валідацією
    const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitizedValue = sanitizeInput(e.target.value)
        setEmail(sanitizedValue)
        validateField('email', sanitizedValue)
    }, [validateField])

    const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setPassword(value)
        validateField('password', value)
    }, [validateField])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            // Валідація перед відправкою
            const emailError = validateEmail(email)
            const passwordError = validatePassword(password)

            if (emailError || passwordError) {
                console.log({ email: emailError, password: passwordError })
                return
            }

            const formData: AuthFormData = {
                email: sanitizeInput(email),
                password: password
            }

            // Додаємо timeout для запиту
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд

            const res = await fetch(`/api/auth/${isLogin ? 'login' : 'register'}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest' // CSRF захист
                },
                body: JSON.stringify(formData),
                signal: controller.signal,
                credentials: 'same-origin',
                cache: 'no-cache'
            })

            clearTimeout(timeoutId)

            if (!res.ok) {
                if (res.status === 429) {
                    throw new Error('Занадто багато спроб. Спробуйте пізніше')
                }
                if (res.status >= 500) {
                    throw new Error('Помилка сервера. Спробуйте пізніше')
                }

                const errorData: AuthResponse = await res.json()
                throw new Error(errorData.error || 'Невідома помилка')
            }

            const data: AuthResponse = await res.json()

            if (!data.success) {
                throw new Error(data.error || 'Помилка автентифікації')
            }

            // Очищаємо форму після успішної автентифікації
            setEmail('')
            setPassword('')
            setFieldErrors({})

            // Редирект з невеликою затримкою для кращого UX
            setTimeout(() => {
                router.push('/')
                router.refresh()
            }, 100)

        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    setError('Запит перевищив час очікування')
                } else {
                    // Обмежуємо довжину помилки для безпеки
                    const errorMessage = err.message.slice(0, 200)
                    setError(errorMessage)
                }
            } else {
                setError('Невідома помилка')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const toggleMode = useCallback(() => {
        setIsLogin(!isLogin)
        setError(null)
        setFieldErrors({})
    }, [isLogin])

    // Перевіряємо чи форма валідна
    const isFormValid = email && password && !fieldErrors.email && !fieldErrors.password && !isLoading


    return (
        <div style={{
            maxWidth: '400px',
            margin: '100px auto',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fff'
        }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
                {isLogin ? 'Увійти' : 'Зареєструватися'}
            </h2>

            <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={handleEmailChange}
                        required
                        disabled={isLoading}
                        autoComplete={isLogin ? 'username' : 'email'}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: fieldErrors.email ? '2px solid #e74c3c' : '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '16px' // Запобігає zoom на iOS
                        }}
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    />
                    {fieldErrors.email && (
                        <p id="email-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                            {fieldErrors.email}
                        </p>
                    )}
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        disabled={isLoading}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: fieldErrors.password ? '2px solid #e74c3c' : '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '16px'
                        }}
                        aria-invalid={!!fieldErrors.password}
                        aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    />
                    {fieldErrors.password && (
                        <p id="password-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                            {fieldErrors.password}
                        </p>
                    )}
                </div>

                {error && (
                    <div style={{
                        color: '#e74c3c',
                        backgroundColor: '#fadbd8',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '15px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!isFormValid}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: isFormValid ? '#3498db' : '#bdc3c7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: isFormValid ? 'pointer' : 'not-allowed',
                        transition: 'background-color 0.2s'
                    }}
                >
                    {isLoading ? 'Завантаження...' : (isLogin ? 'Увійти' : 'Зареєструватися')}
                </button>
            </form>

            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                {isLogin ? 'Немає акаунту?' : 'Вже маєте акаунт?'}{' '}
                <button
                    type="button"
                    onClick={toggleMode}
                    disabled={isLoading}
                    style={{
                        color: '#3498db',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        textDecoration: 'underline',
                        fontSize: '14px'
                    }}
                >
                    {isLogin ? 'Зареєструватися' : 'Увійти'}
                </button>
            </p>
        </div>
    )
}


// // apps/web/app/auth/page.tsx
// 'use client'
//
// import React, { useState } from 'react'
// import { createBrowserClient } from '@supabase'
// import { useRouter } from 'next/navigation'
//
// export default function AuthPage() {
//     const supabase = createBrowserClient()
//     const router = useRouter()
//
//     const [email, setEmail] = useState('')
//     const [password, setPassword] = useState('')
//     const [isLogin, setIsLogin] = useState(true)
//     const [error, setError] = useState<string | null>(null)
//
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault()
//         setError(null)
//
//         const { error } = isLogin
//             ? await supabase.auth.signInWithPassword({ email, password })
//             : await supabase.auth.signUp({ email, password })
//
//         if (error) {
//             setError(error.message)
//         } else {
//             // await fetch('api/auth/callback')
//             // router.push('/')
//             await supabase.auth.signInWithPassword({ email, password })
//             router.push('/')
//             router.refresh()
//         }
//     }
//
//     return (
//         <div style={{ maxWidth: '400px', margin: '100px auto' }}>
//             <h2>{isLogin ? 'Sign In' : 'Sign Up'}</h2>
//
//             <form onSubmit={handleSubmit}>
//                 <input
//                     type="email"
//                     placeholder="Email"
//                     value={email}
//                     onChange={e => setEmail(e.target.value)}
//                     required
//                     style={{ width: '100%', marginBottom: 10, padding: 8 }}
//                 />
//                 <input
//                     type="password"
//                     placeholder="Password"
//                     value={password}
//                     onChange={e => setPassword(e.target.value)}
//                     required
//                     style={{ width: '100%', marginBottom: 10, padding: 8 }}
//                 />
//                 {error && <p style={{ color: 'red' }}>{error}</p>}
//                 <button type="submit" style={{ width: '100%', padding: 8 }}>
//                     {isLogin ? 'Sign In' : 'Sign Up'}
//                 </button>
//             </form>
//
//             <p style={{ marginTop: 12 }}>
//                 {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
//                 <button
//                     type="button"
//                     onClick={() => setIsLogin(!isLogin)}
//                     style={{ color: 'blue', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
//                 >
//                     {isLogin ? 'Sign Up' : 'Sign In'}
//                 </button>
//             </p>
//         </div>
//     )
// }