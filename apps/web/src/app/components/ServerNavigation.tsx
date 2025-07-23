// apps/web/components/ServerNavigation.tsx
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function ServerNavigation() {
    const [user, setUser] = useState<User | null>(null)
    const supabase = createBrowserClient()
    const router = useRouter()

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser()
            setUser(data.user)
            router.refresh()
        }
        fetchUser()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        router.refresh()
    }

    if (!user) {
        return (
            <button onClick={() => router.push('/auth')}>
                Увійти / Зареєструватися
            </button>
        )
    }

    return (
        <div style={{ display: 'flex', gap: '1rem' }}>
            <span>{user.email}</span>
            <button onClick={handleLogout}>Вийти</button>
        </div>
    )
}








// import { redirect } from 'next/navigation'
// import { createServerClient } from '@supabase'
// import { cookies } from 'next/headers'
// import Link from "next/link";
//
//
// export async function signOutAction() {
//     'use server'
//     const supabase = await createServerClient()
//     await supabase.auth.signOut()
//     redirect('/')
// }
//
// export default async function ServerNavigation() {
//
//
//     const supabase = await createServerClient()
//     const {
//         data: { user },
//     } = await supabase.auth.getUser()
//
//     if (user) {
//         return (
//             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
//         <span style={{
//             color: '#374151',
//             fontSize: '0.875rem',
//             fontWeight: '500'
//         }}>
//           Привіт, {user.email?.split('@')[0]}
//         </span>
//
//                 <form action={signOutAction}>
//                     <button
//                         type="submit"
//                         style={{
//                             padding: '0.5rem 1rem',
//                             backgroundColor: '#ef4444',
//                             color: 'white',
//                             border: 'none',
//                             borderRadius: '6px',
//                             fontSize: '0.875rem',
//                             fontWeight: '500',
//                             cursor: 'pointer',
//                             transition: 'background-color 0.2s'
//                         }}
//                     >
//                         Вийти
//                     </button>
//                 </form>
//             </div>
//         )
//     }
//
//     return (
//         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
//             <Link
//                 // href="/auth?mode=login"
//                 href={`/auth?mode=login&redirect=${encodeURIComponent(currentPath)}`}
//                 style={{
//                     padding: '0.5rem 1rem',
//                     color: '#374151',
//                     textDecoration: 'none',
//                     fontSize: '0.875rem',
//                     fontWeight: '500',
//                     borderRadius: '6px',
//                     transition: 'background-color 0.2s'
//                 }}
//             >
//                 Увійти
//             </Link>
//
//             <Link
//                 // href="/auth?mode=register"
//                 href={`/auth?mode=login&redirect=${encodeURIComponent(currentPath)}`}
//                 style={{
//                     padding: '0.5rem 1rem',
//                     backgroundColor: '#2563eb',
//                     color: 'white',
//                     textDecoration: 'none',
//                     borderRadius: '6px',
//                     fontSize: '0.875rem',
//                     fontWeight: '500',
//                     transition: 'background-color 0.2s'
//                 }}
//             >
//                 Реєстрація
//             </Link>
//         </div>
//     )
// }