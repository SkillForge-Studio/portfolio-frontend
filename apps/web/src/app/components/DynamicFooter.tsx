'use client'

import { usePathname } from 'next/navigation'
import { DefaultFooter, AuthFooter } from './Footer'

export default function DynamicFooter() {
    const pathname = usePathname()
    const isAuthPage = pathname.startsWith('/Auth')

    return isAuthPage ? <AuthFooter /> : <DefaultFooter />
}
