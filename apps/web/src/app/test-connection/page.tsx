import { cookies } from 'next/headers';
import { createClient } from "../../../../../packages/supabase/server";

export default async function TestConnectionPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.from('test_db_connection').select();

    if (error) {
        return (
            <div className="text-red-600">
                <strong>Error:</strong> {error.message}
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-xl font-bold mb-4">Test DB Connection</h1>
            <ul className="space-y-2">
                {data?.map((row, i) => (
                    <li key={i} className="border p-2 rounded">
                        {JSON.stringify(row)}
                    </li>
                ))}
            </ul>
        </div>
    );
}
