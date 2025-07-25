// web/middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@supabase/middleware'

// Допустимі origin для різних середовищ
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://skillforge-portfolio.vercel.app']
    : ['https://preview-skillforge-portfolio.vercel.app', 'http://localhost:3000']

// Список публічних маршрутів
const PUBLIC_PATHS = [
    '/',
    '/auth',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth',
    '/api/health'
]

// Список статичних ресурсів
const STATIC_PATHS = [
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json'
]

// CSP заголовки
const CSP_HEADER = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' blob: data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
].join('; ')

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const origin = request.headers.get('origin') || ''

    // Перевірка чи origin дозволений
    const isAllowedOrigin = allowedOrigins.includes(origin)

    // 1. Обробка preflight-запиту (OPTIONS)
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400',
                'Content-Length': '0'
            }
        })
    }

    // 2. Пропускаємо статичні ресурси
    if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next()
    }

    // 3. Створюємо відповідь
    const response = NextResponse.next()

    // 4. Додаємо CORS заголовки динамічно
    if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // 5. Security Headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set('Content-Security-Policy', CSP_HEADER)

    // 6. HSTS в production
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }

    // 7. API-specific headers
    if (pathname.startsWith('/api/')) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1'
        response.headers.set('x-client-ip', ip)

        const contentLength = request.headers.get('content-length')
        if (contentLength && parseInt(contentLength) > 1024 * 1024) {
            return new NextResponse('Payload too large', { status: 413 })
        }
    }

    // 8. Пропускаємо публічні маршрути без авторизації
    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))
    if (isPublicPath) {
        return response
    }

    // 9. Захищені маршрути – перевірка автентифікації
    return await updateSession(request)
}


export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Any file with an extension (.svg, .png, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|woff|woff2|ttf|eot|ico|json)$).*)',
    ],
}