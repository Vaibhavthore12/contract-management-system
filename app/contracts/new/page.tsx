'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import { Input } from '@/components/FormInputs';
import { FieldType, FIELD_TYPE_CONFIG } from '@/lib/types';

interface BlueprintField {
    id: string;
    type: FieldType;
    label: string;
    order: number;
}

interface Blueprint {
    id: string;
    name: string;
    description: string | null;
    fields: BlueprintField[];
}

function NewContractForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedBlueprintId = searchParams.get('blueprintId');

    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
    const [name, setName] = useState('');
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBlueprints = async () => {
            try {
                const res = await fetch('/api/blueprints');
                const data = await res.json();
                if (data.success) {
                    setBlueprints(data.data);

                    // Preselect blueprint if provided
                    if (preselectedBlueprintId) {
                        const preselected = data.data.find((b: Blueprint) => b.id === preselectedBlueprintId);
                        if (preselected) {
                            setSelectedBlueprint(preselected);
                            initializeFieldValues(preselected);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching blueprints:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlueprints();
    }, [preselectedBlueprintId]);

    const initializeFieldValues = (blueprint: Blueprint) => {
        const values: Record<string, string> = {};
        blueprint.fields.forEach((field) => {
            values[field.id] = field.type === 'checkbox' ? 'false' : '';
        });
        setFieldValues(values);
    };

    const handleBlueprintSelect = (blueprintId: string) => {
        const blueprint = blueprints.find((b) => b.id === blueprintId);
        if (blueprint) {
            setSelectedBlueprint(blueprint);
            initializeFieldValues(blueprint);
        } else {
            setSelectedBlueprint(null);
            setFieldValues({});
        }
    };

    const handleFieldChange = (fieldId: string, value: string) => {
        setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedBlueprint) {
            setError('Please select a blueprint');
            return;
        }

        if (!name.trim()) {
            setError('Contract name is required');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blueprintId: selectedBlueprint.id,
                    name,
                    fieldValues,
                }),
            });

            const data = await res.json();
            if (data.success) {
                router.push(`/contracts/${data.data.id}`);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to create contract');
        } finally {
            setSaving(false);
        }
    };

    const renderFieldInput = (field: BlueprintField) => {
        const value = fieldValues[field.id] || '';

        switch (field.type) {
            case 'text':
                return (
                    <Input
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        value={value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    />
                );
            case 'date':
                return (
                    <input
                        type="date"
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    />
                );
            case 'signature':
                return (
                    <div className="relative">
                        <Input
                            placeholder="Type your name as signature"
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="italic"
                        />
                        {value && (
                            <p className="mt-2 text-lg italic text-indigo-400 font-serif">
                                {value}
                            </p>
                        )}
                    </div>
                );
            case 'checkbox':
                return (
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={value === 'true'}
                            onChange={(e) => handleFieldChange(field.id, e.target.checked ? 'true' : 'false')}
                            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-slate-300">I agree to {field.label.toLowerCase()}</span>
                    </label>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return <div className="text-center text-slate-400 py-12">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link href="/contracts" className="text-slate-400 hover:text-white text-sm mb-2 inline-block">
                    ← Back to Contracts
                </Link>
                <h1 className="text-3xl font-bold text-white">Create Contract</h1>
                <p className="mt-1 text-slate-400">Create a new contract from a blueprint template</p>
            </div>

            {blueprints.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-12 text-center">
                    <p className="text-slate-400 mb-4">No blueprints available. Create a blueprint first.</p>
                    <Link href="/blueprints/new">
                        <Button>Create Blueprint</Button>
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Blueprint Selection */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Select Blueprint</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {blueprints.map((blueprint) => (
                                <button
                                    key={blueprint.id}
                                    type="button"
                                    onClick={() => handleBlueprintSelect(blueprint.id)}
                                    className={`p-4 rounded-lg border text-left transition-all ${selectedBlueprint?.id === blueprint.id
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                                        }`}
                                >
                                    <h3 className="font-medium text-white">{blueprint.name}</h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {blueprint.fields.length} fields
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedBlueprint && (
                        <>
                            {/* Contract Name */}
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">Contract Details</h2>
                                <Input
                                    label="Contract Name"
                                    placeholder="e.g., John Doe - Employment Contract"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Field Values */}
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">Fill Contract Fields</h2>
                                <div className="space-y-6">
                                    {selectedBlueprint.fields.map((field) => (
                                        <div key={field.id} className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                                                <span>{FIELD_TYPE_CONFIG[field.type].icon}</span>
                                                {field.label}
                                            </label>
                                            {renderFieldInput(field)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={saving} disabled={!selectedBlueprint}>
                            Create Contract
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default function NewContractPage() {
    return (
        <Suspense fallback={<div className="text-center text-slate-400 py-12">Loading...</div>}>
            <NewContractForm />
        </Suspense>
    );
}
