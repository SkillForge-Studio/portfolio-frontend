// apps/web/app/logout/route.ts
import { createServerClient as createClient } from '@supabase'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic' // щоб не кешувалося

export async function POST() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}
