// apps/web/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/server'
import { z } from 'zod'

// Rate limiting для реєстрації (менш суворий)
const registerAttempts = new Map<string, { count: number; lastAttempt: number }>()

const registerSchema = z.object({
    email: z.string()
        .email('Невірний формат email')
        .max(254, 'Email занадто довгий')
        .transform(val => val.toLowerCase().trim()),
    password: z.string()
        .min(12, 'Пароль повинен містити мінімум 12 символів')
        .max(128, 'Пароль занадто довгий')
        .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Пароль повинен містити принаймні одну велику літеру, одну малу літеру та одну цифру')
})

function checkRegisterRateLimit(ip: string): boolean {
    const now = Date.now()
    const attempts = registerAttempts.get(ip)

    if (!attempts) {
        registerAttempts.set(ip, { count: 1, lastAttempt: now })
        return true
    }

    // Скидаємо лічильник кожні 60 хвилин
    if (now - attempts.lastAttempt > 60 * 60 * 1000) {
        registerAttempts.set(ip, { count: 1, lastAttempt: now })
        return true
    }

    // Максимум 3 реєстрації за годину
    if (attempts.count >= 3) {
        return false
    }

    attempts.count++
    attempts.lastAttempt = now
    return true
}

export async function POST(request: NextRequest) {
    try {
        // Аналогічні перевірки як в login
        const contentType = request.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
            return NextResponse.json(
                { success: false, error: 'Невірний Content-Type' },
                { status: 400 }
            )
        }

        const requestedWith = request.headers.get('X-Requested-With')
        if (requestedWith !== 'XMLHttpRequest') {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1'

        if (!checkRegisterRateLimit(ip)) {
            return NextResponse.json(
                { success: false, error: 'Занадто багато спроб реєстрації. Спробуйте через годину' },
                { status: 429 }
            )
        }

        const body = await request.json()
        const validatedData = registerSchema.parse(body)

        const supabase = await createClient()

        const { data, error } = await supabase.auth.signUp({
            email: validatedData.email,
            password: validatedData.password,
            options: {
                emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
            }
        })

        if (error) {
            console.error('Registration error:', {
                message: error.message,
                ip,
                email: validatedData.email,
                timestamp: new Date().toISOString()
            })

            // Специфічні помилки для реєстрації
            if (error.message.includes('already registered')) {
                return NextResponse.json(
                    { success: false, error: 'Користувач з таким email вже існує' },
                    { status: 409 }
                )
            }

            return NextResponse.json(
                { success: false, error: 'Помилка реєстрації. Спробуйте пізніше' },
                { status: 400 }
            )
        }

        console.log('Successful registration:', {
            userId: data.user?.id,
            email: validatedData.email,
            ip,
            timestamp: new Date().toISOString()
        })

        return NextResponse.json({
            success: true,
            message: 'Реєстрація успішна. Перевірте email для підтвердження',
            requiresVerification: !data.session
        })

    } catch (error) {
        console.error('Registration API error:', error)

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