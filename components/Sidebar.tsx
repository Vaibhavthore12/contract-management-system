'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Blueprints', href: '/blueprints', icon: '📋' },
    { name: 'Contracts', href: '/contracts', icon: '📄' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg">
                    C
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white">ContractHub</h1>
                    <p className="text-xs text-slate-400">Management Platform</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="mt-6 px-4">
                <ul className="space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));

                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                        U
                    </div>
                    <div>
                        <p className="text-sm text-white font-medium">Demo User</p>
                        <p className="text-xs text-slate-400">Admin</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
