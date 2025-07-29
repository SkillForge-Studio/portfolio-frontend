// packages/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const PROTECTED_PATHS = [
    '/dashboard',
    '/profile',
    '/settings',
    '/admin'
]

const ADMIN_PATHS = ['/admin']

export async function updateSession(request: NextRequest) {
    try {
        let supabaseResponse = NextResponse.next({
            request: {
                headers: request.headers,
            },
        })

        const supabase = createServerClient(supabaseUrl, supabaseKey, {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // ВАЖЛИВО: Правильні налаштування cookies
                        supabaseResponse.cookies.set(name, value, {
                            ...options,
                            secure: process.env.NODE_ENV === 'production',
                            httpOnly: true,
                            sameSite: 'lax',
                            path: '/',
                            // Додаємо максимальний термін для auth cookies
                            maxAge: name.includes('auth-token') ? 60 * 60 * 24 * 7 : options?.maxAge // 7 днів для auth токенів
                        })
                    })
                },
            },
        })

        // КРИТИЧНО: Обов'язково викликаємо getUser для оновлення сесії
        const {
            data: { user },
            error
        } = await supabase.auth.getUser()

        const { pathname } = request.nextUrl

        console.log('Supabase middleware:', {
            pathname,
            hasUser: !!user,
            error: error?.message,
            cookies: request.cookies.getAll().map(c => c.name),
            timestamp: new Date().toISOString()
        })

        // Якщо помилка при отриманні користувача і це захищений маршрут
        if (error && PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
            console.error('Auth error on protected path:', error)
            const url = request.nextUrl.clone()
            url.pathname = '/auth'
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
        }

        // Перенаправлення неавторизованих користувачів з захищених маршрутів
        if (!user && PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth'
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
        }

        // Перевірка ролей для admin маршрутів
        if (user && ADMIN_PATHS.some(path => pathname.startsWith(path))) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (!profile || profile.role !== 'admin') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }

        // Перенаправлення авторизованих користувачів з auth сторінок
        if (user && (pathname.startsWith('/auth') || pathname.startsWith('/login'))) {
            return NextResponse.redirect(new URL('/', request.url))
        }

        // Логування для моніторингу
        if (user) {
            console.log('Authenticated request:', {
                userId: user.id,
                email: user.email,
                path: pathname,
                ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
                timestamp: new Date().toISOString()
            })
        }

        return supabaseResponse

    } catch (error) {
        console.error('Session update error:', error)

        // У випадку критичної помилки
        const url = request.nextUrl.clone()
        url.pathname = '/auth'
        url.searchParams.set('error', 'session_error')
        return NextResponse.redirect(url)
    }
}