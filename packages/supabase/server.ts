// packages/supabase/server.ts
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

// Кешована функція для створення клієнта
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
                        const secureOptions = {
                            ...options,
                            secure: process.env.NODE_ENV === 'production',
                            httpOnly: true,
                            sameSite: 'lax' as const,
                            path: '/',
                            maxAge: options?.maxAge || 60 * 60 * 24 * 7 // 7 днів
                        }

                        cookieStore.set(name, value, secureOptions)
                    })
                } catch (error) {
                    console.warn('Cookie setting failed in Server Component:', error)
                }
            },
        },
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true, // КРИТИЧНО для OAuth
            flowType: 'pkce'
        }
    })
})

// Функція для отримання користувача з обробкою помилок
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