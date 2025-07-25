// web/middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@supabase/middleware'

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

const isPublicPath = (pathname: string) => [...PUBLIC_PATHS].some(p => pathname === p || pathname.startsWith(p))
const isStaticPath = (pathname: string) => STATIC_PATHS.some(p => pathname.startsWith(p))

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

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

function applySecurityHeaders(response: NextResponse) {
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set('Content-Security-Policy', CSP_HEADER)

    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
}

function applyCorsHeaders(response: NextResponse) {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value)
    })
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // --- CORS Preflight
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: CORS_HEADERS
        })
    }

    // --- Статичні файли
    if (isStaticPath(pathname)) {
        return NextResponse.next()
    }

    // --- Базовий response
    let response = NextResponse.next()

    applyCorsHeaders(response)
    applySecurityHeaders(response)

    // --- API: обмеження розміру тіла запиту
    if (pathname.startsWith('/api/')) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') || '127.0.0.1'
        response.headers.set('x-client-ip', ip)

        const contentLength = request.headers.get('content-length')
        if (contentLength && parseInt(contentLength) > 1024 * 1024) {
            return new NextResponse('Payload too large', { status: 413 })
        }
    }

    // --- Публічні сторінки
    if (isPublicPath(pathname)) {
        return response
    }

    // --- Захищені маршрути: перевіряємо автентифікацію
    try {
        const result = await updateSession(request)
        if (result) return result
        return response
    } catch (error) {
        console.error('[middleware] Supabase session error:', error)
        return NextResponse.redirect(new URL('/auth?error=session_failed', request.url))
    }
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