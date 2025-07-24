// // supabase/packages/server.ts
// 'use server'
//
//
// import { createServerClient } from '@supabase/ssr'
// import { cookies } from 'next/headers'
//
// export async function createClient() {
//     const cookieStore = await cookies()
//
//     return createServerClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//         {
//             cookies: {
//                 getAll() {
//                     return cookieStore.getAll()
//                 },
//                 setAll(cookiesToSet) {
//                     try {
//                         cookiesToSet.forEach(({ name, value, options }) =>
//                             cookieStore.set(name, value, options)
//                         )
//                     } catch {
//                         // The `setAll` method was called from a Server Component.
//                         // This can be ignored if you have middleware refreshing
//                         // user sessions.
//                     }
//                 },
//             },
//         }
//     )
// }



// supabase/packages/server.ts
'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

// Валідація environment змінних
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

// Кешована функція для створення клієнта (оптимізація)
export const createClient = cache(async () => {
    const cookieStore = await cookies()

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // Додаємо додаткові security опції для cookies
                        const secureOptions = {
                            ...options,
                            secure: process.env.NODE_ENV === 'production',
                            httpOnly: true,
                            sameSite: 'lax' as const,
                            path: '/',
                            // Додаємо максимальний термін життя
                            maxAge: options?.maxAge || 60 * 60 * 24 * 7 // 7 днів
                        }

                        cookieStore.set(name, value, secureOptions)
                    })
                } catch (error) {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                    console.warn('Cookie setting failed in Server Component:', error)
                }
            },
        },
        auth: {
            // Додаткові налаштування автентифікації
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce' // Використовуємо PKCE для додаткової безпеки
        }
    })
})

// Допоміжна функція для отримання користувача з обробкою помилок
export async function getCurrentUser() {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error('Error getting current user:', error)
            return null
        }

        return user
    } catch (error) {
        console.error('Failed to get current user:', error)
        return null
    }
}

// Функція для отримання сесії з валідацією
export async function getCurrentSession() {
    try {
        const supabase = await createClient()
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            console.error('Error getting session:', error)
            return null
        }

        // Перевіряємо чи сесія не експайрена
        if (session?.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
            console.warn('Session expired')
            return null
        }

        return session
    } catch (error) {
        console.error('Failed to get session:', error)
        return null
    }
}

// Безпечна функція для виходу
export async function signOut() {
    try {
        const supabase = await createClient()
        const { error } = await supabase.auth.signOut()

        if (error) {
            console.error('Sign out error:', error)
            throw new Error('Failed to sign out')
        }

        return { success: true }
    } catch (error) {
        console.error('Sign out failed:', error)
        return { success: false, error: 'Failed to sign out' }
    }
}

// Функція для перевірки ролі користувача
export async function checkUserRole(requiredRole: string) {
    try {
        const user = await getCurrentUser()
        if (!user) return false

        const supabase = await createClient()
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (error || !profile) {
            console.error('Error checking user role:', error)
            return false
        }

        return profile.role === requiredRole
    } catch (error) {
        console.error('Failed to check user role:', error)
        return false
    }
}

// Функція для безпечного виконання операцій з БД
export async function executeWithAuth<T>(
    operation: (supabase: any, user: any) => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { data: null, error: 'Unauthorized' }
        }

        const supabase = await createClient()
        const data = await operation(supabase, user)

        return { data, error: null }
    } catch (error) {
        console.error('Database operation failed:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}