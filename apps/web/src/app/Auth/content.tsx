// content.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@supabase/client'

export function AuthPageContent() {
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()

    const redirectTo = searchParams.get('redirect') || '/'

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                router.replace(redirectTo)
            }
        })
    }, [])

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/Auth/callback?redirect=${redirectTo}`,
            },
        })
    }

    const handleEmailLogin = async () => {
        const email = prompt('Введіть вашу пошту:')
        if (email) {
            await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/Auth/callback?redirect=${redirectTo}`,
                },
            })
            alert('Перевірте пошту для входу')
        }
    }

    return (
        <div className="flex items-center justify-center h-screen bg-white">
            <div className="flex flex-col items-center gap-4 p-8 rounded-lg shadow-lg bg-gray-100">
                <h1 className="text-xl font-semibold">Увійти / Зареєструватися</h1>
                <button
                    onClick={handleGoogleLogin}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Увійти через Google
                </button>
                <button
                    onClick={handleEmailLogin}
                    className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
                >
                    Увійти через Email
                </button>
            </div>
        </div>
    )
}
