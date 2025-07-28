// apps/web/app/api/auth/oauth/callback/route.ts
import { createServerClient } from '@supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import {User} from "@supabase/auth-helpers-nextjs";
import {selfGetURL} from "@/lib/getURLs";

// Валідація callback параметрів
const callbackSchema = z.object({
    code: z.string().min(1, 'Відсутній код авторизації'),
    state: z.string().optional(),
    error: z.string().optional(),
    error_description: z.string().optional()
})

// Функція для логування OAuth подій
function logOAuthEvent(event: string, data: Record<string, unknown>) {
    console.log(`OAuth ${event}:`, {
        ...data,
        timestamp: new Date().toISOString()
    })
}

// Функція для створення профілю користувача якщо не існує
async function ensureUserProfile(
    supabase: SupabaseClient,
    user: User
) {
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
                    role: 'user', // Базова роль
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])

            if (profileError) {
                console.error('Profile creation error:', profileError)
                // Не кидаємо помилку, просто логуємо
            } else {
                logOAuthEvent('profile_created', {
                    userId: user.id,
                    email: user.email,
                    provider: user.app_metadata?.provider
                })
            }
        }
    } catch (error) {
        console.error('Profile creation failed:', error)
        // Не перериваємо процес авторизації
    }
}

export async function GET(request: NextRequest) {
    try {
        const requestUrl = new URL(request.url)

        // Перевіряємо на помилки OAuth
        const error = requestUrl.searchParams.get('error')
        const errorDescription = requestUrl.searchParams.get('error_description')

        if (error) {
            logOAuthEvent('error', {
                error,
                errorDescription,
                ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
            })

            const errorMessages = {
                'access_denied': 'Доступ заборонено користувачем',
                'invalid_request': 'Невірний запит авторизації',
                'unauthorized_client': 'Неавторизований клієнт',
                'unsupported_response_type': 'Непідтримуваний тип відповіді',
                'invalid_scope': 'Невірні права доступу',
                'server_error': 'Помилка сервера OAuth',
                'temporarily_unavailable': 'Сервіс тимчасово недоступний'
            }

            const userFriendlyError = errorMessages[error as keyof typeof errorMessages] || 'Помилка OAuth авторизації'

            return NextResponse.redirect(`${selfGetURL()}/auth?error=${encodeURIComponent(userFriendlyError)}`)
        }

        // Валідуємо параметри
        const code = requestUrl.searchParams.get('code')
        const state = requestUrl.searchParams.get('state')

        if (!code) {
            return NextResponse.redirect(`${selfGetURL()}/auth?error=${encodeURIComponent('Відсутній код авторизації')}`)
        }

        // Перевіряємо state для CSRF захисту (якщо використовується)
        if (state) {
            // Тут можна додати перевірку state параметра
            // наприклад, порівняти з збереженим у сесії значенням
        }

        const supabase = await createServerClient()

        // Обмінюємо код на сесію
        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

        if (sessionError) {
            logOAuthEvent('session_exchange_error', {
                error: sessionError.message,
                code: code.substring(0, 10) + '...', // Логуємо тільки частину коду
                ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
            })

            return NextResponse.redirect(`${selfGetURL()}/auth?error=${encodeURIComponent('Помилка створення сесії')}`)
        }

        if (!sessionData.user) {
            return NextResponse.redirect(`${selfGetURL()}/auth?error=${encodeURIComponent('Користувач не знайдений')}`)
        }

        const user = sessionData.user

        // Створюємо профіль користувача якщо потрібно
        await ensureUserProfile(supabase, user)

        // Логування успішної авторизації
        logOAuthEvent('success', {
            userId: user.id,
            email: user.email,
            provider: user.app_metadata?.provider,
            isNewUser: user.created_at === user.last_sign_in_at,
            ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
            userAgent: request.headers.get('user-agent')
        })

        // Перевіряємо чи це новий користувач
        const isNewUser = user.created_at === user.last_sign_in_at

        // TODO: Redirect to destination target page
        const redirectPath = isNewUser ? '/' : '/'

        // Додаємо параметри для кращого UX
        const redirectUrl = new URL(redirectPath, selfGetURL())
        if (isNewUser) {
            redirectUrl.searchParams.set('new_user', 'true')
        }
        redirectUrl.searchParams.set('oauth_success', 'true')

        // Успішний callback
        return NextResponse.redirect(redirectUrl.toString())

    } catch (error) {
        console.error('Callback processing error:', error)

        logOAuthEvent('callback_error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
        })

        return NextResponse.redirect(`${selfGetURL()}/auth?error=${encodeURIComponent('Помилка обробки авторизації')}`)
    }
}

// POST метод для отримання інформації про користувача
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            return NextResponse.json(
                { success: false, error: 'Не авторизований' },
                { status: 401 }
            )
        }

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Користувач не знайдений' },
                { status: 404 }
            )
        }

        // Отримуємо додаткову інформацію з профілю
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role, created_at, updated_at')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                provider: user.app_metadata?.provider,
                emailVerified: !!user.email_confirmed_at,
                lastSignIn: user.last_sign_in_at,
                createdAt: user.created_at,
                profile: profile || null
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