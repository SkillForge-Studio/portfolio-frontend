// apps/web/app/api/feedback/route.ts

import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = [
    'https://preview-skillforge-portfolio.vercel.app',
    'https://skillforge-portfolio.vercel.app',
]

export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get('origin') ?? ''
    const isAllowedOrigin = allowedOrigins.includes(origin)

    const headers: Record<string, string> = {
        ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    }

    return new NextResponse(null, {
        status: 204,
        headers,
    })
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        console.log('Feedback received:', body)

        // Додатково можеш щось обробити тут або надіслати в Supabase

        return NextResponse.json({ success: true }, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        })
    } catch (error) {
        console.error('Error in POST:', error)
        return NextResponse.json({ error: 'Invalid request' }, {
            status: 400,
        })
    }
}
