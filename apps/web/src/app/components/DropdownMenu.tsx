'use client';

// import React, { useRef, useLayoutEffect, useState } from 'react';

// components/DropdownMenu.tsx

import React from 'react';

const columns = [
    {
        title: 'Веб-розробка',
        items: [
            'Сайти під ключ',
            'Лендінги',
            'Магазини',
            'Корпоративні платформи',
            'Веб-додатки',
        ],
        note: 'HTML, CSS, JS, React, Next.js, Node.js',
    },
    {
        title: 'Бекенд',
        items: [
            'API сервіс',
            'Бази даних',
            'Автоматизації',
            'Інтеграції',
            'Серверна логіка',
        ],
        note: 'SQL/NoSQL, серверні фреймворки',
    },
    {
        title: '3D / Візуалізація',
        items: [
            '3D моделі',
            'Анімації',
            'Ілюстрації',
            'Візуалізація',
            'Арт/Концепти',
        ],
        note: '3D для бізнесу і презентацій',
    }
];

export default function DropdownMenu() {
    return (
        <div style={{
            marginTop: '1px',
            position: 'absolute',
            top: '100%',
            left: '0',
            backgroundColor: 'white',
            padding: '2rem',
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            width: '700px',
            transition: 'all 0.3s ease',
            zIndex: 999,
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0',
                height: '100%'
            }}>
                {columns.map((column, idx) => (
                    <div key={idx} style={{
                        padding: '0 1.5rem',
                        borderRight: idx < columns.length - 1 ? '1px solid #e0e0e0' : 'none'
                    }}>
                        <h4>{column.title}</h4>
                        {column.items.map((item, index) => (
                            <div key={index}>{item}</div>
                        ))}
                        <div style={{
                            fontSize: '0.85rem',
                            color: '#666',
                            marginTop: '0.5rem'
                        }}>
                            {column.note}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}