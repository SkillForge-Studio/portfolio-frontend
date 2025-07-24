// apps/web/app/components/ServerNavigation.tsx

import { createServerClient } from '@supabase'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ServerNavigation() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    // const { data: sessionData } = await supabase.auth.getSession()


    if (!user) {
        return (
            <Link href="/auth">
                <button>Увійти / Зареєструватися</button>
            </Link>
        )
    }

    return (
        <form action="/logout" method="POST" style={{ display: 'flex', gap: '1rem' }}>
            <span>{user.email}</span>
            <button type="submit">Вийти</button>
        </form>
    )
}





// 'use client'
//
// import { useEffect, useState } from 'react'
// import { createBrowserClient } from '@supabase'
// import { useRouter } from 'next/navigation'
// import type { User } from '@supabase/supabase-js'
//
// export default function ServerNavigation() {
//     const [user, setUser] = useState<User | null | undefined>(undefined)
//     const supabase = createBrowserClient()
//     const router = useRouter()
//
//     useEffect(() => {
//         const getUser = async () => {
//             const { data } = await supabase.auth.getUser()
//             setUser(data.user)
//         }
//
//         getUser()
//
//         const {
//             data: { subscription },
//         } = supabase.auth.onAuthStateChange((_event, session) => {
//             setUser(session?.user ?? null)
//         })
//
//         return () => subscription.unsubscribe()
//     }, [])
//
//     const handleLogout = async () => {
//         await supabase.auth.signOut()
//         setUser(null)
//         router.push('/')
//     }
//
//     if (user === undefined) {
//         return null
//     }
//
//     if (!user) {
//         return (
//             <button onClick={() => router.push('/auth')}>
//                 Увійти / Зареєструватися
//             </button>
//         )
//     }
//
//     return (
//         <div style={{ display: 'flex', gap: '1rem' }}>
//             <span>{user.email}</span>
//             <button onClick={handleLogout}>Вийти</button>
//         </div>
//     )
// }
