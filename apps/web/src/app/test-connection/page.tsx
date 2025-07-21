// import { createClient } from '@supabase/server' // через alias
//
// export type LogMessage = {
//     id: number
//     created_at: string
//     message: string
// }
//
// export default async function Page() {
//     const supabase = await createClient()
//
//     const { data, error } = await supabase
//         .from('test_db_connection')
//         .select('*')
//
//     if (error) {
//         return <div>Помилка: {error.message}</div>
//     }
//
//     return (
//         <div>
//             <h1>Дані з test_db_connection</h1>
//             <ul>
//                 {data?.map((entry: LogMessage) => (
//                     <li key={entry.id}>
//                         <strong>{new Date(entry.created_at).toLocaleString()}:</strong> {entry.message}
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     )
// }

import { createClient } from '@supabase/server'

export type LogMessage = {
    id: number
    created_at: string
    message: string
}

export default async function Page() {
    console.log('🔍 Checking environment variables:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '❌ Missing')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '❌ Missing')

    try {
        const supabase = await createClient()
        console.log('🔗 Supabase client created successfully')

        const { data, error } = await supabase
            .from('test_db_connection')
            .select('*')

        console.log('📊 Query result:', { data, error })

        if (error) {
            console.error('❌ Database error:', error)
            return (
                <div>
                    <h1>Помилка підключення</h1>
                    <p>Помилка: {error.message}</p>
                    <pre>{JSON.stringify(error, null, 2)}</pre>
                </div>
            )
        }

        if (!data || data.length === 0) {
            return (
                <div>
                    <p></p>
                    <h1>Дані з test_db_connection</h1>
                    <p>Таблиця порожня або не існує</p>
                    <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
                </div>
            )
        }

        return (
            <div>
                <h1>Дані з test_db_connection</h1>
                <p>Знайдено записів: {data.length}</p>
                <ul>
                    {data?.map((entry: LogMessage) => (
                        <li key={entry.id}>
                            <strong>{new Date(entry.created_at).toLocaleString()}:</strong> {entry.message}
                        </li>
                    ))}
                </ul>
            </div>
        )
    } catch (err) {
        console.error('💥 Unexpected error:', err)
        return (
            <div>
                <h1>Непередбачена помилка</h1>
                <pre>{JSON.stringify(err, null, 2)}</pre>
            </div>
        )
    }
}