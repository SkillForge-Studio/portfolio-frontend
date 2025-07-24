// supabase/packages/browser.ts (для клієнтського коду)
'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton pattern для браузерного клієнта
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
    if (!supabaseInstance) {
        supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce'
            },
            // Додаткові налаштування для браузера
            realtime: {
                params: {
                    eventsPerSecond: 10 // Обмежуємо кількість realtime подій
                }
            }
        })
    }

    return supabaseInstance
}

// Хук для безпечного використання auth
export function useAuthGuard() {
    const supabase = createClient()

    const signOutSafely = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('Sign out error:', error)
                // Принудово очищаємо локальний стан
                window.location.href = '/auth'
            }
        } catch (error) {
            console.error('Sign out failed:', error)
            window.location.href = '/auth'
        }
    }

    const refreshSession = async () => {
        try {
            const { error } = await supabase.auth.refreshSession()
            if (error) {
                console.error('Session refresh error:', error)
                await signOutSafely()
            }
        } catch (error) {
            console.error('Session refresh failed:', error)
            await signOutSafely()
        }
    }

    return {
        signOut: signOutSafely,
        refreshSession
    }
}