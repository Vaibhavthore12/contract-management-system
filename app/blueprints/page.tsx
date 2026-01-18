'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import { FIELD_TYPE_CONFIG, FieldType } from '@/lib/types';

interface BlueprintField {
    id: string;
    type: FieldType;
    label: string;
    positionX: number;
    positionY: number;
    order: number;
}

interface Blueprint {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    fields: BlueprintField[];
    _count: {
        contracts: number;
    };
}

export default function BlueprintsPage() {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBlueprints = async () => {
        try {
            const res = await fetch('/api/blueprints');
            const data = await res.json();
            if (data.success) {
                setBlueprints(data.data);
            }
        } catch (error) {
            console.error('Error fetching blueprints:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlueprints();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this blueprint?')) return;

        try {
            const res = await fetch(`/api/blueprints/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchBlueprints();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error deleting blueprint:', error);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Blueprints</h1>
                    <p className="mt-1 text-slate-400">Reusable contract templates</p>
                </div>
                <Link href="/blueprints/new">
                    <Button>+ New Blueprint</Button>
                </Link>
            </div>

            {/* Blueprints Grid */}
            {loading ? (
                <div className="text-center text-slate-400 py-12">Loading...</div>
            ) : blueprints.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-12 text-center">
                    <p className="text-slate-400 mb-4">No blueprints created yet</p>
                    <Link href="/blueprints/new">
                        <Button>Create Your First Blueprint</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blueprints.map((blueprint) => (
                        <div
                            key={blueprint.id}
                            className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl border border-slate-700 p-6 hover:border-indigo-500/50 transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{blueprint.name}</h3>
                                    {blueprint.description && (
                                        <p className="text-sm text-slate-400 mt-1">{blueprint.description}</p>
                                    )}
                                </div>
                                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-full">
                                    {blueprint._count.contracts} contracts
                                </span>
                            </div>

                            {/* Fields preview */}
                            <div className="space-y-2 mb-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Fields</p>
                                <div className="flex flex-wrap gap-2">
                                    {blueprint.fields.map((field) => (
                                        <span
                                            key={field.id}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-xs text-slate-300"
                                        >
                                            <span>{FIELD_TYPE_CONFIG[field.type].icon}</span>
                                            {field.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                                <span className="text-xs text-slate-500">
                                    Created {new Date(blueprint.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex gap-2">
                                    <Link href={`/blueprints/${blueprint.id}`}>
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(blueprint.id)}
                                        disabled={blueprint._count.contracts > 0}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
