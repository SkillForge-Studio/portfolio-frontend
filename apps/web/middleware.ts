// apps/web/middleware.ts - ПОВНІСТЮ ЗАМІНІТЬ ВМІСТ ЦЬОГО ФАЙЛУ
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@supabase/middleware'

console.log('🔥 MIDDLEWARE FILE LOADED - This should appear in logs')

const allowedOrigins = [
    'https://skillforge-portfolio.vercel.app',
    'https://preview-skillforge-portfolio.vercel.app',
    'http://localhost:3000'
]

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

const STATIC_PATHS = [
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json'
]

function isOriginAllowed(origin: string | null): boolean {
    if (!origin) return false
    return allowedOrigins.some(allowedOrigin => {
        if (origin === allowedOrigin) return true
        if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
            return true
        }
        return false
    })
}

function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
    const isAllowedOrigin = isOriginAllowed(origin)
    if (isAllowedOrigin && origin) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
    response.headers.set('Access-Control-Max-Age', '86400')
    return response
}

export async function middleware(request: NextRequest) {
    const origin = request.headers.get('origin')
    const { pathname, searchParams } = request.nextUrl

    console.log('🚀 MIDDLEWARE EXECUTING:', {
        pathname,
        hasCode: searchParams.has('code'),
        code: searchParams.get('code')?.substring(0, 8) + '...',
        method: request.method,
        url: request.url
    })

    // 1. Пропускаємо статичні ресурси
    if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
        console.log('📁 Static path, skipping:', pathname)
        return NextResponse.next()
    }

    // 2. OPTIONS requests
    if (request.method === 'OPTIONS') {
        console.log('🔧 OPTIONS request')
        const response = NextResponse.json({}, { status: 200 })
        return addCorsHeaders(response, origin)
    }

    // 3. КРИТИЧНО ВАЖЛИВО: OAuth callback redirect
    if (pathname === '/' && searchParams.has('code')) {
        console.log('🔄 OAuth callback detected - redirecting to handler')
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const error_description = searchParams.get('error_description')

        const callbackUrl = new URL('/api/auth/callback', request.url)
        if (code) callbackUrl.searchParams.set('code', code)
        if (state) callbackUrl.searchParams.set('state', state)
        if (error) callbackUrl.searchParams.set('error', error)
        if (error_description) callbackUrl.searchParams.set('error_description', error_description)

        console.log('🔄 Redirecting to:', callbackUrl.toString())
        return NextResponse.redirect(callbackUrl)
    }

    // 4. Стандартна обробка з updateSession
    let response: NextResponse

    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))
    console.log('🔍 Path analysis:', { pathname, isPublicPath })

    if (isPublicPath) {
        try {
            console.log('🔄 Running updateSession for public path')
            response = await updateSession(request)
        } catch (error) {
            console.error('❌ Session update error on public path:', error)
            response = NextResponse.next()
        }
    } else {
        try {
            console.log('🔄 Running updateSession for protected path')
            response = await updateSession(request)
        } catch (error) {
            console.error('❌ Auth error:', error)
            response = NextResponse.redirect(new URL('/auth', request.url))
        }
    }

    // 5. Headers
    response = addCorsHeaders(response, origin)
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')

    console.log('✅ Middleware completed for:', pathname)
    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - files with extensions
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|woff|woff2|ttf|eot|ico|json|xml|txt)$).*)',
    ],
}