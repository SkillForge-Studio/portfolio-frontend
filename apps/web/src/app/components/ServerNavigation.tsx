// apps/web/src/app/components/ServerNavigation.tsx
import { createClient } from '@supabase/server'
import Link from 'next/link'
import LogoutButton from "@/app/components/LogoutButton"
import {getURL} from "../../../lib/getURLs";

export default async function ServerNavigation() {
    const supabase = await createClient()

    // Отримуємо користувача та сесію
    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()

    if (!user || !session) {
        return (
            <Link href="/auth">
                <button style={{
                    background: 'transparent',
                    border: '1px solid #e0e0e0',
                    color: '#171717',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s'
                }}>
                    Увійти / Зареєструватися
                </button>
            </Link>
        )
    }

    return (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{
                fontSize: '0.9rem',
                color: '#171717',
                fontWeight: '500'
            }}>
                {user.email}
            </span>
            <LogoutButton />
        </div>
    )
}