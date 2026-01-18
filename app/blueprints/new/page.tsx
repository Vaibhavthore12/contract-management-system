'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Input, Textarea } from '@/components/FormInputs';
import { FieldType, FIELD_TYPE_CONFIG, BlueprintFieldInput } from '@/lib/types';

export default function NewBlueprintPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fields, setFields] = useState<BlueprintFieldInput[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const addField = (type: FieldType) => {
        const newField: BlueprintFieldInput = {
            type,
            label: `${FIELD_TYPE_CONFIG[type].label} Field`,
            positionX: 0,
            positionY: fields.length * 60,
            order: fields.length,
        };
        setFields([...fields, newField]);
    };

    const updateField = (index: number, updates: Partial<BlueprintFieldInput>) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], ...updates };
        setFields(updated);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === fields.length - 1)
        ) {
            return;
        }

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const updated = [...fields];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        updated.forEach((field, i) => {
            field.order = i;
        });
        setFields(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Blueprint name is required');
            return;
        }

        if (fields.length === 0) {
            setError('At least one field is required');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/blueprints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, fields }),
            });

            const data = await res.json();
            if (data.success) {
                router.push('/blueprints');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to create blueprint');
        } finally {
            setSaving(false);
        }
    };

    const fieldTypes: FieldType[] = ['text', 'date', 'signature', 'checkbox'];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Create Blueprint</h1>
                <p className="mt-1 text-slate-400">Design a reusable contract template</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
                    <Input
                        label="Blueprint Name"
                        placeholder="e.g., Employment Agreement"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Textarea
                        label="Description (optional)"
                        placeholder="Brief description of this template..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Field Types */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Add Fields</h2>
                    <div className="flex flex-wrap gap-3">
                        {fieldTypes.map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => addField(type)}
                                className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all border border-slate-600 hover:border-indigo-500"
                            >
                                <span className="text-xl">{FIELD_TYPE_CONFIG[type].icon}</span>
                                <span className="text-white font-medium">{FIELD_TYPE_CONFIG[type].label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fields List */}
                {fields.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Blueprint Fields ({fields.length})</h2>
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                                >
                                    <div className="flex flex-col gap-1">
                                        <button
                                            type="button"
                                            onClick={() => moveField(index, 'up')}
                                            disabled={index === 0}
                                            className="text-slate-400 hover:text-white disabled:opacity-30"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveField(index, 'down')}
                                            disabled={index === fields.length - 1}
                                            className="text-slate-400 hover:text-white disabled:opacity-30"
                                        >
                                            ▼
                                        </button>
                                    </div>

                                    <span className="text-2xl">{FIELD_TYPE_CONFIG[field.type].icon}</span>

                                    <div className="flex-1">
                                        <Input
                                            placeholder="Field label"
                                            value={field.label}
                                            onChange={(e) => updateField(index, { label: e.target.value })}
                                        />
                                    </div>

                                    <span className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-300">
                                        {FIELD_TYPE_CONFIG[field.type].label}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => removeField(index)}
                                        className="text-red-400 hover:text-red-300 px-2"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
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
                    <Button type="submit" isLoading={saving}>
                        Create Blueprint
                    </Button>
                </div>
            </form>
        </div>
    );
}
