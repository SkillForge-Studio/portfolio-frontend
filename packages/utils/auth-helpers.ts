// utils/auth-helpers.ts - Допоміжні функції для валідації
export const authHelpers = {
    // Валідація email
    isValidEmail: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email) && email.length <= 254
    },

    // Валідація пароля
    isValidPassword: (password: string): boolean => {
        return password.length >= 12 &&
            password.length <= 128 &&
            /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    },

    // Sanitize input
    sanitizeInput: (input: string): string => {
        return input.trim().replace(/[<>]/g, '')
    },

    // Генерація безпечного redirect URL
    getSafeRedirectUrl: (redirectTo: string | null, baseUrl: string): string => {
        if (!redirectTo) return `${baseUrl}/dashboard`

        try {
            const url = new URL(redirectTo, baseUrl)
            // Дозволяємо тільки внутрішні redirect-и
            if (url.origin === baseUrl) {
                return url.href
            }
        } catch {
            // Невалідний URL
        }

        return `${baseUrl}/dashboard`
    }
}