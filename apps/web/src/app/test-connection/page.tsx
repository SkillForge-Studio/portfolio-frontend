import { createClient } from '@supabase/server' // через alias

export type LogMessage = {
    id: number
    created_at: string
    message: string
}

export default async function Page() {
    const supabase = await createClient() // БЕЗ await, бо функція повертає готовий клієнт

    const { data, error } = await supabase
        .from('test_db_connection')
        .select('*')

    if (error) {
        return <div>Помилка: {error.message}</div>
    }

    return (
        <div>
            <h1>Дані з test_db_connection</h1>
            <ul>
                {data?.map((entry: LogMessage) => (
                    <li key={entry.id}>
                        <strong>{new Date(entry.created_at).toLocaleString()}:</strong> {entry.message}
                    </li>
                ))}
            </ul>
        </div>
    )
}
