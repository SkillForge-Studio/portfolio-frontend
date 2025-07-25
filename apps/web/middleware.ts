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

function isOriginAllowed(origin: string): boolean {
    if (!origin) return false

    return allowedOrigins.some(allowedOrigin => {
        // Точне співпадіння
        if (origin === allowedOrigin) return true

        // Для development дозволяємо різні порти localhost
        if (process.env.NODE_ENV !== 'production' &&
            origin.startsWith('http://localhost:')) {
            return true
        }

        return false
    })
}

export async function middleware(request: NextRequest) {
    const origin = request.headers.get('origin') || ''
    const { pathname } = request.nextUrl

    console.log('Middleware:', {
        origin,
        method: request.method,
        pathname,
        userAgent: request.headers.get('user-agent')?.slice(0, 50)
    })

    // 1. Пропускаємо статичні ресурси без обробки
    if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next()
    }

    const isAllowedOrigin = isOriginAllowed(origin)

    // 2. Обробка preflight-запиту (OPTIONS)
    if (request.method === 'OPTIONS') {
        console.log('OPTIONS request:', { origin, isAllowedOrigin })

        const headers: Record<string, string> = {
            'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
            'Access-Control-Max-Age': '86400',
            'Content-Length': '0'
        }

        // Тільки для дозволених origin додаємо CORS заголовки
        if (isAllowedOrigin) {
            headers['Access-Control-Allow-Origin'] = origin
            headers['Access-Control-Allow-Credentials'] = 'true'
        }

        return new NextResponse(null, {
            status: 200, // Змінено з 204 на 200
            headers
        })
    }

    // 3. Створюємо відповідь для всіх інших запитів
    let response: NextResponse

    // 4. Перевіряємо чи це публічний маршрут
    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))

    if (isPublicPath) {
        response = NextResponse.next()
    } else {
        // Захищені маршрути – перевірка автентифікації
        try {
            response = await updateSession(request)
        } catch (error) {
            console.error('Auth error:', error)
            response = NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // 5. Додаємо CORS заголовки для дозволених origin
    if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')

    // 6. Security Headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set('Content-Security-Policy', CSP_HEADER)

    // 7. HSTS в production
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }

    // 8. API-specific headers
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

    return response
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