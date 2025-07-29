// apps/web/src/app/api/auth/callback/route.ts
import { createClient } from '@supabase/server'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getURL } from '../../../../../lib/getURLs'
import { SupabaseClient } from '@supabase/supabase-js'
import {User} from "@supabase/auth-helpers-nextjs";

// Rate limiting для OAuth callbacks
const callbackAttempts = new Map<string, { count: number; lastAttempt: number }>()

function checkCallbackRateLimit(ip: string): boolean {
    const now = Date.now()
    const attempts = callbackAttempts.get(ip)

    if (!attempts) {
        callbackAttempts.set(ip, { count: 1, lastAttempt: now })
        return true
    }

    // Скидаємо лічильник кожні 10 хвилин
    if (now - attempts.lastAttempt > 10 * 60 * 1000) {
        callbackAttempts.set(ip, { count: 1, lastAttempt: now })
        return true
    }

    // Максимум 10 спроб за 10 хвилин
    if (attempts.count >= 10) {
        return false
    }

    attempts.count++
    attempts.lastAttempt = now
    return true
}

// Функція для створення профілю користувача якщо не існує
async function ensureUserProfile(supabase: SupabaseClient, user: User) {
    try {
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single()

        if (!existingProfile) {
            // Створюємо профіль з OAuth даними
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                    provider: user.app_metadata?.provider,
                    role: 'user',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])

            if (profileError) {
                console.error('Profile creation error:', profileError)
            } else {
                console.log('Profile created for OAuth user:', {
                    userId: user.id,
                    email: user.email,
                    provider: user.app_metadata?.provider
                })
            }
        }
    } catch (error) {
        console.error('Profile creation failed:', error)
    }
}

export async function GET(request: NextRequest) {
    try {
        const requestUrl = new URL(request.url)
        const code = requestUrl.searchParams.get('code')
        const error = requestUrl.searchParams.get('error')
        const errorDescription = requestUrl.searchParams.get('error_description')

        // Отримуємо IP для rate limiting
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1'

        // Перевіряємо rate limiting
        if (!checkCallbackRateLimit(ip)) {
            console.warn('OAuth callback rate limit exceeded:', { ip })
            return NextResponse.redirect(`${getURL()}auth?error=rate_limit`)
        }

        // Перевіряємо на помилки від OAuth провайдера
        if (error) {
            console.error('OAuth provider error:', {
                error,
                errorDescription,
                ip,
                timestamp: new Date().toISOString()
            })

            const errorMessages: Record<string, string> = {
                'access_denied': 'access_denied',
                'invalid_request': 'invalid_request',
                'unauthorized_client': 'unauthorized_client',
                'unsupported_response_type': 'unsupported_response_type',
                'invalid_scope': 'invalid_scope',
                'server_error': 'server_error',
                'temporarily_unavailable': 'temporarily_unavailable'
            }

            const userFriendlyError = errorMessages[error] || 'oauth_error'
            return NextResponse.redirect(`${getURL()}auth?error=${userFriendlyError}`)
        }

        // Перевіряємо наявність authorization code
        if (!code) {
            console.error('Missing authorization code:', { ip })
            return NextResponse.redirect(`${getURL()}auth?error=missing_code`)
        }

        const supabase = await createClient()

        // Обміняємо code на сесію
        const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)

        if (authError) {
            console.error('Auth code exchange error:', {
                error: authError.message,
                code: authError.status,
                ip,
                timestamp: new Date().toISOString()
            })

            // Специфічні помилки
            let errorType = 'callback_error'
            if (authError.message.includes('expired')) {
                errorType = 'code_expired'
            } else if (authError.message.includes('invalid')) {
                errorType = 'invalid_code'
            }

            return NextResponse.redirect(`${getURL()}auth?error=${errorType}`)
        }

        // Перевіряємо чи користувач успішно автентифікований
        if (!data.user || !data.session) {
            console.error('No user or session after exchange:', { ip })
            return NextResponse.redirect(`${getURL()}auth?error=no_session`)
        }

        // Створюємо профіль користувача якщо потрібно
        await ensureUserProfile(supabase, data.user)

        // Логуємо успішний OAuth login
        console.log('Successful OAuth login:', {
            userId: data.user.id,
            email: data.user.email,
            provider: data.user.app_metadata?.provider,
            ip,
            timestamp: new Date().toISOString()
        })

        // Очищуємо rate limit для успішних спроб
        callbackAttempts.delete(ip)

        // ВАЖЛИВО: Створюємо response з правильним встановленням cookies
        const response = NextResponse.redirect(getURL())

        // Отримуємо оновлений supabase client для встановлення cookies
        const updatedSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return []
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, {
                                ...options,
                                secure: process.env.NODE_ENV === 'production',
                                httpOnly: true,
                                sameSite: 'lax' as const,
                                path: '/',
                                maxAge: options?.maxAge || 60 * 60 * 24 * 7 // 7 днів
                            })
                        })
                    },
                },
            }
        )

        // Викликаємо getSession для встановлення cookies
        await updatedSupabase.auth.getSession()

        // Встановлюємо додаткові security headers
        response.headers.set('X-Content-Type-Options', 'nosniff')
        response.headers.set('X-Frame-Options', 'DENY')
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

        return response

    } catch (error) {
        console.error('OAuth callback processing error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            url: request.url,
            timestamp: new Date().toISOString()
        })

        return NextResponse.redirect(`${getURL()}auth?error=server_error`)
    }
}