'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/client'

export const dynamic = 'force-dynamic'; // 🛡️ ключове

export default function AuthCallbackPage() {
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const redirect = urlParams.get('redirect') || '/'

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                router.replace(redirect)
            } else {
                router.replace(`/Auth?redirect=${redirect}`)
            }
        })
    }, [])

    return (
        <div className="flex items-center justify-center h-screen">
            <p>Зачекайте, виконується авторизація...</p>
        </div>
    )
}
