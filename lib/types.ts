// Field types supported in blueprints
export type FieldType = 'text' | 'date' | 'signature' | 'checkbox';

// Contract lifecycle statuses
export type ContractStatus = 'created' | 'approved' | 'sent' | 'signed' | 'locked' | 'revoked';

// Blueprint field definition
export interface BlueprintFieldInput {
    type: FieldType;
    label: string;
    positionX: number;
    positionY: number;
    order: number;
}

// Create blueprint request
export interface CreateBlueprintRequest {
    name: string;
    description?: string;
    fields: BlueprintFieldInput[];
}

// Create contract request
export interface CreateContractRequest {
    blueprintId: string;
    name: string;
    fieldValues?: Record<string, string>; // blueprintFieldId -> value
}

// Update contract field values request
export interface UpdateContractValuesRequest {
    fieldValues: Record<string, string>; // blueprintFieldId -> value
}

// Transition contract request
export interface TransitionContractRequest {
    targetStatus: ContractStatus;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Status filter options for dashboard
export type StatusFilter = 'all' | 'active' | 'pending' | 'signed';

// Status to filter mapping
export const STATUS_FILTERS: Record<StatusFilter, ContractStatus[]> = {
    all: ['created', 'approved', 'sent', 'signed', 'locked', 'revoked'],
    active: ['created', 'approved', 'sent'],
    pending: ['created', 'approved'],
    signed: ['signed', 'locked'],
};

// Field type configuration for UI
export const FIELD_TYPE_CONFIG: Record<FieldType, { label: string; icon: string }> = {
    text: { label: 'Text', icon: '📝' },
    date: { label: 'Date', icon: '📅' },
    signature: { label: 'Signature', icon: '✍️' },
    checkbox: { label: 'Checkbox', icon: '☑️' },
};

// Status display configuration
export const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bgColor: string }> = {
    created: { label: 'Created', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    approved: { label: 'Approved', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    sent: { label: 'Sent', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    signed: { label: 'Signed', color: 'text-green-700', bgColor: 'bg-green-100' },
    locked: { label: 'Locked', color: 'text-gray-700', bgColor: 'bg-gray-200' },
    revoked: { label: 'Revoked', color: 'text-red-700', bgColor: 'bg-red-100' },
};
