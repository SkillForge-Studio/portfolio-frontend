'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
    const router = useRouter()

    const handleLogout = async () => {
        const res = await fetch('/api/auth/logout', {
            method: 'POST'
        })

        if (res.ok) {
            router.push('/')
            router.refresh()
        }
    }

    return (
        <button
            onClick={handleLogout}
            style={{
                background: 'transparent',
                    border: '1px solid #e0e0e0',
                    color: '#171717',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s'
            }}
        >
            Вийти
        </button>
    )
}