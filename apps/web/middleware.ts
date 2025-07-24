// web/middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@supabase/middleware'

// Список публічних маршрутів
const PUBLIC_PATHS = [
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
    try {
        const { pathname } = request.nextUrl

        // Пропускаємо статичні ресурси
        if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
            return NextResponse.next()
        }

        // Базові security заголовки
        const response = NextResponse.next()

        // Security Headers
        response.headers.set('X-Frame-Options', 'DENY')
        response.headers.set('X-Content-Type-Options', 'nosniff')
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
        response.headers.set('X-XSS-Protection', '1; mode=block')
        response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        response.headers.set('Content-Security-Policy', CSP_HEADER)

        // HSTS для production
        if (process.env.NODE_ENV === 'production') {
            response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        }

        // Rate limiting заголовки для API
        if (pathname.startsWith('/api/')) {
            const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                request.headers.get('x-real-ip') ||
                '127.0.0.1'

            // Додаємо IP до заголовків для API обробки
            response.headers.set('x-client-ip', ip)

            // Обмежуємо розмір payload для API
            const contentLength = request.headers.get('content-length')
            if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB
                return new NextResponse('Payload too large', { status: 413 })
            }
        }

        // Перевіряємо чи це публічний маршрут
        const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))

        if (isPublicPath) {
            return response
        }

        // Для захищених маршрутів - перевіряємо автентифікацію
        return await updateSession(request)

    } catch (error) {
        console.error('Middleware error:', error)
        return NextResponse.redirect(new URL('/auth?error=middleware_error', request.url))
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







// // web/middleware.ts
// import { type NextRequest } from 'next/server'
// import { updateSession } from '@supabase/middleware'
//
// export async function middleware(request: NextRequest) {
//     return await updateSession(request)
// }
// export const config = {
//     matcher: [
//         /*
//          * Match all request paths except for the ones starting with:
//          * - _next/static (static files)
//          * - _next/image (image optimization files)
//          * - favicon.ico (favicon file)
//          * Feel free to modify this pattern to include more paths.
//          */
//         '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//     ],
// }