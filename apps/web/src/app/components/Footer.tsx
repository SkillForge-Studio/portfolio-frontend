import Link from "next/link";

export function DefaultFooter() {
    return (
        <footer style={{
            background: '#ffffff',
            borderTop: '1px solid #e0e0e0',
            padding: '3rem 1rem',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: '2rem'
            }}>
                <div style={{ flex: '1 1 250px' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Проєкт</h3>
                    <p style={{ lineHeight: '1.6' }}>
                        SkillForge — платформа для демонстрації технічних навичок та креативного підходу до розробки.
                    </p>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Зв&#39;язок</h3>
                    <p style={{ lineHeight: '1.6' }}>Telegram, GitHub, Viber, Discord...</p>
                </div>
                <div style={{ flex: '1 1 150px' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Навігація</h3>
                    <ul style={{ listStyle: 'none', padding: 0, lineHeight: '1.8' }}>
                        <li><Link href="/#projects">Проєкти</Link></li>
                        <li><Link href="/#skills">Навички</Link></li>
                        <li><Link href="/#contact">Контакти</Link></li>
                    </ul>
                </div>
            </div>
            <div style={{
                textAlign: 'center',
                marginTop: '2rem',
                fontSize: '0.875rem',
                color: '#777'
            }}>
                <p>© 2025 SkillForge. Всі права захищені.</p>
            </div>
        </footer>
    )
}

export function AuthFooter() {
    return (
        <footer style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ffffffcc',
            backdropFilter: 'blur(4px)',
            padding: '0.75rem',
            fontSize: '0.85rem',
            color: '#444',
            textAlign: 'center',
            zIndex: 999,
            borderTop: '1px solid #ddd'
        }}>
            © 2025 SkillForge. Всі права захищені.
        </footer>
    )
}
