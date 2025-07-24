// apps/web/app/api/auth/callback/route.ts
import { createClient } from '@supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const requestUrl = new URL(request.url)
        const code = requestUrl.searchParams.get('code')
        const origin = requestUrl.origin

        if (code) {
            const supabase = await createClient()

            const { error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error('Auth callback error:', error)
                return NextResponse.redirect(`${origin}/auth?error=callback_error`)
            }
        }

        // Успішний callback
        return NextResponse.redirect(`${origin}/`)

    } catch (error) {
        console.error('Callback processing error:', error)
        return NextResponse.redirect(`${request.nextUrl.origin}/auth?error=server_error`)
    }
}

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            return NextResponse.json(
                { success: false, error: 'Не авторизований' },
                { status: 401 }
            )
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user?.id,
                email: user?.email,
                created_at: user?.created_at
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








// // apps/web/app/api/auth/callback/route.ts
// import { createServerClient } from '@supabase'
// import { cookies } from 'next/headers'
// import { NextResponse } from 'next/server'
//
// export async function GET() {
//     const supabase = await createServerClient()
//     const { data: { user } } = await supabase.auth.getUser()
//     return NextResponse.json({ ok: true, user })
// }
