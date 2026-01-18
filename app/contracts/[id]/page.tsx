'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { Input } from '@/components/FormInputs';
import { ContractStatus, FieldType, FIELD_TYPE_CONFIG, STATUS_CONFIG } from '@/lib/types';
import { getAllowedTransitions, getTransitionConfig, isEditable, isTerminalState } from '@/lib/lifecycle';

interface BlueprintField {
    id: string;
    type: FieldType;
    label: string;
    order: number;
}

interface ContractFieldValue {
    id: string;
    blueprintFieldId: string;
    value: string;
    blueprintField: BlueprintField;
}

interface Contract {
    id: string;
    name: string;
    status: ContractStatus;
    createdAt: string;
    updatedAt: string;
    blueprint: {
        id: string;
        name: string;
        fields: BlueprintField[];
    };
    fieldValues: ContractFieldValue[];
}

export default function ContractDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [transitioning, setTransitioning] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    const fetchContract = async () => {
        try {
            const res = await fetch(`/api/contracts/${params.id}`);
            const data = await res.json();
            if (data.success) {
                setContract(data.data);
                // Initialize field values
                const values: Record<string, string> = {};
                data.data.fieldValues.forEach((fv: ContractFieldValue) => {
                    values[fv.blueprintFieldId] = fv.value;
                });
                setFieldValues(values);
            } else {
                router.push('/contracts');
            }
        } catch (error) {
            console.error('Error fetching contract:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContract();
    }, [params.id]);

    const handleTransition = async (targetStatus: ContractStatus) => {
        setTransitioning(true);
        try {
            const res = await fetch(`/api/contracts/${params.id}/transition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetStatus }),
            });

            const data = await res.json();
            if (data.success) {
                setContract(data.data);
                // Re-initialize field values
                const values: Record<string, string> = {};
                data.data.fieldValues.forEach((fv: ContractFieldValue) => {
                    values[fv.blueprintFieldId] = fv.value;
                });
                setFieldValues(values);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error transitioning contract:', error);
        } finally {
            setTransitioning(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/contracts/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fieldValues }),
            });

            const data = await res.json();
            if (data.success) {
                setContract(data.data);
                setEditMode(false);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error saving contract:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleFieldChange = (fieldId: string, value: string) => {
        setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const renderFieldValue = (field: BlueprintField, value: string, editable: boolean) => {
        if (!editable || !editMode) {
            // Display mode
            switch (field.type) {
                case 'checkbox':
                    return (
                        <div className="flex items-center gap-2">
                            <span className={value === 'true' ? 'text-green-400' : 'text-slate-400'}>
                                {value === 'true' ? '✓ Yes' : '✗ No'}
                            </span>
                        </div>
                    );
                case 'signature':
                    return value ? (
                        <p className="text-lg italic text-indigo-400 font-serif border-b border-indigo-400/30 pb-1">
                            {value}
                        </p>
                    ) : (
                        <p className="text-slate-500 italic">Not signed</p>
                    );
                case 'date':
                    return value ? (
                        <p className="text-white">{new Date(value).toLocaleDateString()}</p>
                    ) : (
                        <p className="text-slate-500">No date set</p>
                    );
                default:
                    return <p className="text-white">{value || <span className="text-slate-500">Empty</span>}</p>;
            }
        }

        // Edit mode
        switch (field.type) {
            case 'checkbox':
                return (
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={value === 'true'}
                            onChange={(e) => handleFieldChange(field.id, e.target.checked ? 'true' : 'false')}
                            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-slate-300">Checked</span>
                    </label>
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
                    <div>
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
            default:
                return (
                    <Input
                        value={value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    />
                );
        }
    };

    if (loading) {
        return <div className="text-center text-slate-400 py-12">Loading...</div>;
    }

    if (!contract) {
        return <div className="text-center text-slate-400 py-12">Contract not found</div>;
    }

    const allowedTransitions = getAllowedTransitions(contract.status);
    const canEdit = isEditable(contract.status);
    const isTerminal = isTerminalState(contract.status);

    // Status timeline
    const statuses: ContractStatus[] = ['created', 'approved', 'sent', 'signed', 'locked'];
    const currentIndex = statuses.indexOf(contract.status);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/contracts" className="text-slate-400 hover:text-white text-sm mb-2 inline-block">
                        ← Back to Contracts
                    </Link>
                    <h1 className="text-3xl font-bold text-white">{contract.name}</h1>
                    <p className="mt-1 text-slate-400">Based on: {contract.blueprint.name}</p>
                </div>
                <StatusBadge status={contract.status} size="lg" />
            </div>

            {/* Status Timeline */}
            {contract.status !== 'revoked' && (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Lifecycle Progress</h2>
                    <div className="flex items-center justify-between">
                        {statuses.map((status, index) => {
                            const isPast = index < currentIndex;
                            const isCurrent = status === contract.status;
                            const isFuture = index > currentIndex;

                            return (
                                <div key={status} className="flex items-center">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isPast
                                                    ? 'bg-green-500 text-white'
                                                    : isCurrent
                                                        ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30'
                                                        : 'bg-slate-700 text-slate-400'
                                                }`}
                                        >
                                            {isPast ? '✓' : index + 1}
                                        </div>
                                        <p className={`mt-2 text-sm ${isCurrent ? 'text-white font-medium' : 'text-slate-400'}`}>
                                            {STATUS_CONFIG[status].label}
                                        </p>
                                    </div>
                                    {index < statuses.length - 1 && (
                                        <div
                                            className={`w-16 h-1 mx-2 rounded ${isPast ? 'bg-green-500' : 'bg-slate-700'
                                                }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Revoked Banner */}
            {contract.status === 'revoked' && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
                    <p className="text-red-400 font-medium">This contract has been revoked and cannot be modified.</p>
                </div>
            )}

            {/* Actions */}
            {!isTerminal && (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
                    <div className="flex flex-wrap gap-3">
                        {canEdit && !editMode && (
                            <Button variant="secondary" onClick={() => setEditMode(true)}>
                                Edit Field Values
                            </Button>
                        )}
                        {editMode && (
                            <>
                                <Button variant="ghost" onClick={() => setEditMode(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} isLoading={saving}>
                                    Save Changes
                                </Button>
                            </>
                        )}
                        {!editMode && allowedTransitions.map((status) => {
                            const config = getTransitionConfig(status);
                            return (
                                <Button
                                    key={status}
                                    variant={config.variant}
                                    onClick={() => handleTransition(status)}
                                    isLoading={transitioning}
                                >
                                    {config.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Field Values */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Contract Fields</h2>
                <div className="space-y-6">
                    {contract.blueprint.fields.map((field) => {
                        const value = fieldValues[field.id] || '';
                        return (
                            <div key={field.id} className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                                    <span>{FIELD_TYPE_CONFIG[field.type].icon}</span>
                                    {field.label}
                                </label>
                                {renderFieldValue(field, value, canEdit)}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Metadata */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Details</h2>
                <dl className="grid grid-cols-2 gap-4">
                    <div>
                        <dt className="text-sm text-slate-400">Created</dt>
                        <dd className="text-white">{new Date(contract.createdAt).toLocaleString()}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-400">Last Updated</dt>
                        <dd className="text-white">{new Date(contract.updatedAt).toLocaleString()}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-400">Blueprint</dt>
                        <dd>
                            <Link href={`/blueprints/${contract.blueprint.id}`} className="text-indigo-400 hover:underline">
                                {contract.blueprint.name}
                            </Link>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-400">Contract ID</dt>
                        <dd className="text-slate-300 font-mono text-sm">{contract.id}</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
