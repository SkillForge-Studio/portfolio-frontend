// apps/web/app/auth/page.tsx
'use client'

import React, { useState } from 'react'
import { createBrowserClient } from '@supabase' // або звідки у тебе експортується createClient
import { useRouter } from 'next/navigation'

export default function AuthPage() {
    const supabase = createBrowserClient()
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const { error } = isLogin
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password })

        if (error) {
            setError(error.message)
        } else {
            router.refresh() // оновити серверний стейт
            router.push('/')
        }
    }

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto' }}>
            <h2>{isLogin ? 'Sign In' : 'Sign Up'}</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', marginBottom: 10, padding: 8 }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', marginBottom: 10, padding: 8 }}
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" style={{ width: '100%', padding: 8 }}>
                    {isLogin ? 'Sign In' : 'Sign Up'}
                </button>
            </form>

            <p style={{ marginTop: 12 }}>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    style={{ color: 'blue', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
            </p>
        </div>
    )
}




// 'use client'
//
// import { Suspense } from 'react'
// import {AuthPageContent} from "@/app/auth/content";
//
//
// export default function AuthPageWrapper() {
//     return (
//         <Suspense fallback={<div>Завантаження...</div>}>
//             <AuthPageContent />
//         </Suspense>
//     )
// }