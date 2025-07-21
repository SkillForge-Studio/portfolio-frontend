'use client'

import { Suspense } from 'react'
import {AuthPageContent} from "@/app/Auth/content";


export default function AuthPageWrapper() {
    return (
        <Suspense fallback={<div>Завантаження...</div>}>
            <AuthPageContent />
        </Suspense>
    )
}