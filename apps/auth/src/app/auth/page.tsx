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

interface OAuthResponse {
    success: boolean
    url?: string
    provider?: string
    error?: string
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
    const [oauthLoading, setOauthLoading] = useState<string | null>(null)
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

    // Серверна обробка OAuth
    const handleOAuth = async (provider: string) => {
        try {
            setOauthLoading(provider)
            setError(null)

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)

            const response = await fetch('/api/auth/oauth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    provider,
                    redirectTo: `${window.location.origin}/auth/callback`
                }),
                signal: controller.signal,
                credentials: 'same-origin',
                cache: 'no-cache'
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Занадто багато спроб. Спробуйте пізніше')
                }
                if (response.status >= 500) {
                    throw new Error('Помилка сервера. Спробуйте пізніше')
                }

                const errorData: OAuthResponse = await response.json()
                throw new Error(errorData.error || 'Помилка OAuth')
            }

            const data: OAuthResponse = await response.json()

            if (!data.success || !data.url) {
                throw new Error(data.error || 'Помилка ініціалізації OAuth')
            }

            // Перенаправляємо користувача на OAuth провайдер
            window.location.href = data.url

        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    setError('Запит перевищив час очікування')
                } else {
                    const errorMessage = err.message.slice(0, 200)
                    setError(errorMessage)
                }
            } else {
                setError('Невідома помилка OAuth')
            }
        } finally {
            setOauthLoading(null)
        }
    }

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
    const isAnyLoading = isLoading || oauthLoading !== null


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                        {isLogin ? 'Увійти' : 'Зареєструватися'}
                    </h2>

                    <form onSubmit={handleSubmit} noValidate className="space-y-6">
                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={handleEmailChange}
                                required
                                disabled={isLoading}
                                autoComplete={isLogin ? 'username' : 'email'}
                                className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                    fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-invalid={!!fieldErrors.email}
                                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                            />
                            {fieldErrors.email && (
                                <p id="email-error" className="mt-2 text-sm text-red-600">
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <input
                                type="password"
                                placeholder="Пароль"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                                disabled={isLoading}
                                autoComplete={isLogin ? 'current-password' : 'new-password'}
                                className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                    fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-invalid={!!fieldErrors.password}
                                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                            />
                            {fieldErrors.password && (
                                <p id="password-error" className="mt-2 text-sm text-red-600">
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!isFormValid}
                            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                                isFormValid
                                    ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                    : 'bg-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {isLoading ? 'Завантаження...' : (isLogin ? 'Увійти' : 'Зареєструватися')}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">або</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleOAuth('google')}
                            disabled={isAnyLoading}
                            className={`mt-4 w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 transition-colors ${
                                isAnyLoading
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                            }`}
                        >
                            {oauthLoading === 'google' ? (
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Увійти через Google
                                </>
                            )}
                        </button>
                    </div>

                    <p className="mt-8 text-center text-sm text-gray-600">
                        {isLogin ? 'Немає акаунту?' : 'Вже маєте акаунт?'}{' '}
                        <button
                            type="button"
                            onClick={toggleMode}
                            disabled={isLoading}
                            className={`font-medium text-blue-600 transition-colors ${
                                isLoading
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'hover:text-blue-500 focus:outline-none focus:underline'
                            }`}
                        >
                            {isLogin ? 'Зареєструватися' : 'Увійти'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}