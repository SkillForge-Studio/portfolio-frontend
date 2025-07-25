// apps/web/app/api/auth/callback/route.ts
import { createClient } from '@supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {getURL} from "../../../../../lib/getURLs";

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

export async function GET(request: NextRequest) {
    try {
        const requestUrl = new URL(request.url)
        const code = requestUrl.searchParams.get('code')
        const error = requestUrl.searchParams.get('error')
        const errorDescription = requestUrl.searchParams.get('error_description')
        const state = requestUrl.searchParams.get('state')

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

            let userFriendlyError = 'oauth_error'
            switch (error) {
                case 'access_denied':
                    userFriendlyError = 'access_denied'
                    break
                case 'invalid_request':
                    userFriendlyError = 'invalid_request'
                    break
                default:
                    userFriendlyError = 'oauth_error'
            }

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

        // Створюємо response з встановленням cookies
        const response = NextResponse.redirect(`${getURL()}`)

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

// POST endpoint для перевірки стану автентифікації
export async function POST(request: NextRequest) {
    try {
        // CSRF захист
        const requestedWith = request.headers.get('X-Requested-With')
        if (requestedWith !== 'XMLHttpRequest') {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error('Get user error:', error)
            return NextResponse.json(
                { success: false, error: 'Не авторизований' },
                { status: 401 }
            )
        }

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Користувач не знайдений' },
                { status: 401 }
            )
        }

        // Повертаємо мінімальну інформацію про користувача
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name,
                avatar: user.user_metadata?.avatar_url,
                provider: user.app_metadata?.provider,
                created_at: user.created_at,
                last_sign_in: user.last_sign_in_at
            }
        })

    } catch (error) {
        console.error('User info error:', error)
        return NextResponse.json(
            { success: false, error: 'Помилка отримання даних користувача' },
            { status: 500 }
        )
    }
}












// import { createServerClient } from '@supabase'
// import { NextRequest, NextResponse } from 'next/server'
//
// export async function GET(request: NextRequest) {
//     try {
//         const requestUrl = new URL(request.url)
//         const code = requestUrl.searchParams.get('code')
//         const origin = requestUrl.origin
//
//         if (code) {
//             const supabase = await createServerClient()
//
//             const { error } = await supabase.auth.exchangeCodeForSession(code)
//
//             if (error) {
//                 console.error('Auth callback error:', error)
//                 return NextResponse.redirect(`${origin}/auth?error=callback_error`)
//             }
//         }
//
//         return NextResponse.redirect(`${origin}/`)
//     } catch (error) {
//         console.error('Callback processing error:', error)
//         return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=server_error`)
//     }
// }
//
// export async function POST() {
//     try {
//         const supabase = await createServerClient()
//         const { data: { user }, error } = await supabase.auth.getUser()
//
//         if (error) {
//             return NextResponse.json(
//                 { success: false, error: 'Не авторизований' },
//                 { status: 401 }
//             )
//         }
//
//         return NextResponse.json({
//             success: true,
//             user: {
//                 id: user?.id,
//                 email: user?.email,
//                 created_at: user?.created_at
//             }
//         })
//     } catch (error) {
//         console.error('User info error:', error)
//         return NextResponse.json(
//             { success: false, error: 'Помилка отримання даних користувача' },
//             { status: 500 }
//         )
//     }
// }








// // apps/web/app/api/auth/callback/route.ts
// import { createServerClient } from '@supabase'
// import { cookies } from 'next/headers'
// import { NextResponse } from 'next/server'
//
// export async function GET() {
//     const supabase = await createServerClient()
//     const { data: { user } } = await supabase.auth.getUser()
//     return NextResponse.json({ ok: true, user })
// }
