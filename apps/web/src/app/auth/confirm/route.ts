// apps/web/app/auth/confirm/page.tsx
import { type EmailOtpType, type AuthError } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createServerClient } from '@supabase'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/'

    let error: AuthError | null = null

    if (token_hash && type) {
        const supabase = await createServerClient()
        const result = await supabase.auth.verifyOtp({ type, token_hash })
        error = result.error

        if (!error) {
            redirect(next)
        }
    }

    redirect(`/error?message=${encodeURIComponent(error?.message || 'Unknown error')}`)
}