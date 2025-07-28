// auth/src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Список маршрутів які потребують автентифікації
const PROTECTED_PATHS = [
    '/dashboard',
    '/profile',
    '/settings',
    '/admin'
]

// Додаткова перевірка ролей
const ADMIN_PATHS = ['/admin']

export async function updateSession(request: NextRequest) {
    try {
        const supabaseResponse = NextResponse.next({
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
                        supabaseResponse.cookies.set(name, value, {
                            ...options,
                            secure: process.env.NODE_ENV === 'production',
                            httpOnly: true,
                            sameSite: 'lax',
                            path: '/'
                        })
                    })
                },
            },
        })

        // Отримуємо користувача
        const {
            data: { user },
            error
        } = await supabase.auth.getUser()

        const { pathname } = request.nextUrl

        // Якщо помилка при отриманні користувача і це захищений маршрут
        if (error && PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
            console.error('Auth error:', error)
            const url = request.nextUrl.clone()
            url.pathname = '/auth'
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
        }

        // Якщо користувач не авторизований і намагається зайти на захищений маршрут
        if (!user && PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth'
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
        }

        // Перевірка ролей для admin маршрутів
        if (user && ADMIN_PATHS.some(path => pathname.startsWith(path))) {
            // Отримуємо метадані користувача для перевірки ролі
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (!profile || profile.role !== 'admin') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }

        // Якщо користувач авторизований і намагається зайти на auth сторінки
        if (user && (pathname.startsWith('/auth') || pathname.startsWith('/login'))) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Логування для моніторингу
        if (user) {
            console.log('Authenticated request:', {
                userId: user.id,
                email: user.email,
                path: pathname,
                ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
                userAgent: request.headers.get('user-agent'),
                timestamp: new Date().toISOString()
            })
        }

        return supabaseResponse

    } catch (error) {
        console.error('Session update error:', error)

        // У випадку критичної помилки перенаправляємо на auth
        const url = request.nextUrl.clone()
        url.pathname = '/auth'
        url.searchParams.set('error', 'session_error')
        return NextResponse.redirect(url)
    }
}