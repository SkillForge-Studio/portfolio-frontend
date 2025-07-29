// apps/web/src/app/api/auth/oauth/route.ts
import { createClient } from '@supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getURL } from '../../../../../lib/getURLs'

// Валідація OAuth запитів
const oauthSchema = z.object({
    provider: z.enum(['google', 'github', 'facebook', 'discord']),
    redirectTo: z.string().url().optional()
})

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

    if (attempts.count >= 5) {
        return false
    }

    attempts.count++
    attempts.lastAttempt = now
    return true
}

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1'

        if (!checkOAuthRateLimit(ip)) {
            console.warn('OAuth rate limit exceeded:', { ip })
            return NextResponse.json(
                { success: false, error: 'Занадто багато спроб. Спробуйте через 5 хвилин' },
                { status: 429 }
            )
        }

        const body = await request.json()
        const validatedData = oauthSchema.parse(body)

        const supabase = await createClient()

        const redirectTo = `${getURL()}api/auth/callback`

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