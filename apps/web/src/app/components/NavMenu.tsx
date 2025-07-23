// app/components/NavMenu.tsx

'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import DropdownMenu from "@/app/components/DropdownMenu";

export default function NavMenu() {
    const [isOpen, setIsOpen] = useState(false);
    let hoverTimeout: NodeJS.Timeout;

    const handleMouseEnter = () => {
        clearTimeout(hoverTimeout);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        hoverTimeout = setTimeout(() => {
            setIsOpen(false);
        }, 200);
    };



    return (
        <nav onMouseLeave={handleMouseLeave}>
            <ul style={{
                display: 'flex',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                height: '100%'
            }}>
                <li>
                    <Link href="/" style={linkStyle}>Головна</Link>
                </li>

                <li
                    style={{ position: 'relative' }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <Link
                        href="#"
                        style={{
                            ...linkStyle,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                        }}
                    >
                        Послуги
                        <ChevronDown
                            size={16}
                            style={{
                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s ease',
                            }}
                        />
                    </Link>

                    {isOpen && (
                        <DropdownMenu />
                    )}
                </li>

                <li>
                    <Link href="/#roadmap" style={linkStyle}>Roadmap</Link>
                </li>
            </ul>
        </nav>
    );
}

// Стилі
const linkStyle: React.CSSProperties = {
    textDecoration: 'none',
    color: '#171717',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
    display: 'flex',
    // alignItems: 'center',
};