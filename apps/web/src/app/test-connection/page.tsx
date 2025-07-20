import { createClient } from '@supabase/server' // через alias

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
                {data?.map((row: any, index: number) => (
                    <li key={index}>{JSON.stringify(row)}</li>
                ))}
            </ul>
        </div>
    )
}
