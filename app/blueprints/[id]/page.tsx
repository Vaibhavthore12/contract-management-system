'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import { Input, Textarea } from '@/components/FormInputs';
import { FieldType, FIELD_TYPE_CONFIG, BlueprintFieldInput } from '@/lib/types';

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
    fields: BlueprintField[];
    _count: {
        contracts: number;
    };
}

export default function BlueprintDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const fetchBlueprint = async () => {
        try {
            const res = await fetch(`/api/blueprints/${params.id}`);
            const data = await res.json();
            if (data.success) {
                setBlueprint(data.data);
                setName(data.data.name);
                setDescription(data.data.description || '');
            } else {
                router.push('/blueprints');
            }
        } catch (error) {
            console.error('Error fetching blueprint:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlueprint();
    }, [params.id]);

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Blueprint name is required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/blueprints/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            });

            const data = await res.json();
            if (data.success) {
                setBlueprint(data.data);
                setEditing(false);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to update blueprint');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center text-slate-400 py-12">Loading...</div>;
    }

    if (!blueprint) {
        return <div className="text-center text-slate-400 py-12">Blueprint not found</div>;
    }

    const hasContracts = blueprint._count.contracts > 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/blueprints" className="text-slate-400 hover:text-white text-sm mb-2 inline-block">
                        ← Back to Blueprints
                    </Link>
                    {editing ? (
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-2xl font-bold"
                        />
                    ) : (
                        <h1 className="text-3xl font-bold text-white">{blueprint.name}</h1>
                    )}
                </div>
                <div className="flex gap-3">
                    {editing ? (
                        <>
                            <Button variant="ghost" onClick={() => setEditing(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} isLoading={saving}>
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href={`/contracts/new?blueprintId=${blueprint.id}`}>
                                <Button variant="success">+ Create Contract</Button>
                            </Link>
                            <Button variant="secondary" onClick={() => setEditing(true)}>
                                Edit
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
                {editing ? (
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a description..."
                        rows={3}
                    />
                ) : (
                    <p className="text-slate-400">
                        {blueprint.description || 'No description provided'}
                    </p>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <p className="text-sm text-slate-400">Total Fields</p>
                    <p className="text-2xl font-bold text-white">{blueprint.fields.length}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <p className="text-sm text-slate-400">Contracts Created</p>
                    <p className="text-2xl font-bold text-white">{blueprint._count.contracts}</p>
                </div>
            </div>

            {/* Fields */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Template Fields</h2>
                    {hasContracts && (
                        <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-1 rounded">
                            Fields locked (contracts exist)
                        </span>
                    )}
                </div>

                {blueprint.fields.length === 0 ? (
                    <p className="text-slate-400">No fields defined</p>
                ) : (
                    <div className="space-y-3">
                        {blueprint.fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                            >
                                <span className="text-slate-500 font-mono text-sm w-6">{index + 1}</span>
                                <span className="text-2xl">{FIELD_TYPE_CONFIG[field.type].icon}</span>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{field.label}</p>
                                    <p className="text-xs text-slate-400">{FIELD_TYPE_CONFIG[field.type].label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
