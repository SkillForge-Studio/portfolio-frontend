import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase'
import { z } from 'zod'

const oauthSchema = z.object({
    provider: z.enum(['google', 'github', 'facebook']),
    redirectTo: z.string().url('Невірний URL для редиректу').optional()
})

// Rate limiting для OAuth запитів
const oauthAttempts = new Map<string, { count: number; lastAttempt: number }>()

function checkOAuthRateLimit(ip: string): boolean {
    const now = Date.now()
    const attempts = oauthAttempts.get(ip)

    if (!attempts) {
        oauthAttempts.set(ip, { count: 1, lastAttempt: now })
        return true
    }

    // Скидаємо лічильник кожні 5 хвилин
    if (now - attempts.lastAttempt > 5 * 60 * 1000) {
        oauthAttempts.set(ip, { count: 1, lastAttempt: now })
        return true
    }

    // Максимум 10 OAuth спроб за 5 хвилин
    if (attempts.count >= 10) {
        return false
    }

    attempts.count++
    attempts.lastAttempt = now
    return true
}

export async function POST(request: NextRequest) {
    try {
        // Базові перевірки безпеки
        const contentType = request.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
            return NextResponse.json(
                { success: false, error: 'Невірний Content-Type' },
                { status: 400 }
            )
        }

        const requestedWith = request.headers.get('X-Requested-With')
        if (requestedWith !== 'XMLHttpRequest') {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Rate limiting
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1'

        if (!checkOAuthRateLimit(ip)) {
            return NextResponse.json(
                { success: false, error: 'Занадто багато OAuth спроб. Спробуйте через 5 хвилин' },
                { status: 429 }
            )
        }

        // const supabase = await createServerClient()
        //
        // const { data, error } = await supabase.auth.signInWithOAuth({
        //     provider: 'google',
        //     options: {
        //         redirectTo: `${request.nextUrl.origin}/api/auth/callback`
        //     }
        // })

        // Валідація даних
        const body = await request.json()
        const validatedData = oauthSchema.parse(body)

        const supabase = await createServerClient()

        // Створюємо OAuth URL
        // const redirectTo = validatedData.redirectTo || `${request.nextUrl.origin}/auth/callback`
        const redirectTo = `${request.nextUrl.origin}/api/auth/oauth/callback`


        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: validatedData.provider,
            options: {
                redirectTo,
                queryParams: validatedData.provider === 'google' ? {
                    access_type: 'offline',
                    prompt: 'consent',
                } : undefined,
                scopes: getProviderScopes(validatedData.provider)
            }
        })

        if (error) {
            console.error('OAuth initialization error:', {
                provider: validatedData.provider,
                error: error.message,
                ip,
                timestamp: new Date().toISOString()
            })

            return NextResponse.json(
                { success: false, error: 'Помилка ініціалізації OAuth' },
                { status: 400 }
            )
        }
        // Логування успішної ініціалізації
        console.log('OAuth initiated:', {
            provider: validatedData.provider,
            ip,
            timestamp: new Date().toISOString()
        })

        return NextResponse.json({
            success: true,
            url: data.url,
            provider: validatedData.provider
        })

    } catch (error) {
        console.error('OAuth API error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: error.issues[0].message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: false, error: 'Внутрішня помилка сервера' },
            { status: 500 }
        )
    }
}

// Функція для отримання scope для різних провайдерів
function getProviderScopes(provider: string): string {
    const scopes = {
        google: 'openid email profile',
        github: 'user:email',
        facebook: 'email',
        discord: 'identify email'
    }

    return scopes[provider as keyof typeof scopes] || 'email'
}