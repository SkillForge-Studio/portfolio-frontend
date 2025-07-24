// apps/web/app/api/auth/callback/route.ts
import { createServerClient } from '@supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return NextResponse.json({ ok: true, user })
}
