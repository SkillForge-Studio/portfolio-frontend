// apps/web/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase'
import { headers } from 'next/headers'
import { z } from 'zod'

// Rate limiting MAP (в production використовуйте Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

// Валідація схеми
const loginSchema = z.object({
    email: z.string()
        .email('Невірний формат email')
        .max(254, 'Email занадто довгий')
        .transform(val => val.toLowerCase().trim()),
    password: z.string()
        .min(12, 'Пароль повинен містити мінімум 12 символів')
        .max(128, 'Пароль занадто довгий')
})

// Rate limiting функція
function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const attempts = loginAttempts.get(ip)

    if (!attempts) {
        loginAttempts.set(ip, { count: 1, lastAttempt: now })
        return true
    }

    // Скидаємо лічильник кожні 15 хвилин
    if (now - attempts.lastAttempt > 15 * 60 * 1000) {
        loginAttempts.set(ip, { count: 1, lastAttempt: now })
        return true
    }

    // Максимум 5 спроб за 15 хвилин
    if (attempts.count >= 5) {
        return false
    }

    attempts.count++
    attempts.lastAttempt = now
    return true
}

export async function POST(request: NextRequest) {
    try {
        // Перевіряємо Content-Type
        const contentType = request.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
            return NextResponse.json(
                { success: false, error: 'Невірний Content-Type' },
                { status: 400 }
            )
        }

        // CSRF захист
        const requestedWith = request.headers.get('X-Requested-With')
        if (requestedWith !== 'XMLHttpRequest') {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Отримуємо IP для rate limiting
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1'

        // Перевіряємо rate limiting
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { success: false, error: 'Занадто багато спроб. Спробуйте через 15 хвилин' },
                { status: 429 }
            )
        }

        // Парсимо і валідуємо дані
        const body = await request.json()
        const validatedData = loginSchema.parse(body)

        // Створюємо Supabase клієнт
        const supabase = await createServerClient()

        // Спроба входу
        const { data, error } = await supabase.auth.signInWithPassword({
            email: validatedData.email,
            password: validatedData.password,
        })

        if (error) {
            // Логуємо помилку (без чутливих даних)
            console.error('Login error:', {
                message: error.message,
                ip,
                email: validatedData.email,
                timestamp: new Date().toISOString()
            })

            // Повертаємо загальну помилку для безпеки
            return NextResponse.json(
                { success: false, error: 'Невірний email або пароль' },
                { status: 401 }
            )
        }

        // Скидаємо лічильник спроб при успішному вході
        loginAttempts.delete(ip)

        // Логуємо успішний вхід
        console.log('Successful login:', {
            userId: data.user?.id,
            email: validatedData.email,
            ip,
            timestamp: new Date().toISOString()
        })

        return NextResponse.json({
            success: true,
            message: 'Успішний вхід'
        })

    } catch (error) {
        console.error('Login API error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: error.issues[0].message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: false, error: 'Внутрішня помилка сервера' },
            { status: 500 }
        )
    }
}