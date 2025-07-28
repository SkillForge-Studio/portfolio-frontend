import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
    const cookieStore = await cookies()

    const response = NextResponse.json({ success: true })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, {
                        ...options,
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/'
                    })
                })
            },
        },
    })

    await supabase.auth.signOut()

    return response
}
