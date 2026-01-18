import { ContractStatus } from './types';

// Valid lifecycle transitions
// created → approved, revoked
// approved → sent, revoked
// sent → signed, revoked
// signed → locked
// locked → (terminal)
// revoked → (terminal)

const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    created: ['approved', 'revoked'],
    approved: ['sent', 'revoked'],
    sent: ['signed', 'revoked'],
    signed: ['locked'],
    locked: [], // Terminal state
    revoked: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
    currentStatus: ContractStatus,
    targetStatus: ContractStatus
): boolean {
    const validTargets = VALID_TRANSITIONS[currentStatus];
    return validTargets.includes(targetStatus);
}

/**
 * Get allowed transitions from current status
 */
export function getAllowedTransitions(currentStatus: ContractStatus): ContractStatus[] {
    return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a contract is in a terminal state (no further transitions allowed)
 */
export function isTerminalState(status: ContractStatus): boolean {
    return status === 'locked' || status === 'revoked';
}

/**
 * Check if a contract is editable (field values can be changed)
 */
export function isEditable(status: ContractStatus): boolean {
    return status === 'created';
}

/**
 * Get human-readable transition labels
 */
export const TRANSITION_LABELS: Record<ContractStatus, string> = {
    created: 'Create',
    approved: 'Approve',
    sent: 'Send',
    signed: 'Sign',
    locked: 'Lock',
    revoked: 'Revoke',
};

/**
 * Get action button configuration for each transition
 */
export function getTransitionConfig(targetStatus: ContractStatus): {
    label: string;
    variant: 'primary' | 'success' | 'warning' | 'danger';
} {
    switch (targetStatus) {
        case 'approved':
            return { label: 'Approve', variant: 'primary' };
        case 'sent':
            return { label: 'Send', variant: 'primary' };
        case 'signed':
            return { label: 'Sign', variant: 'success' };
        case 'locked':
            return { label: 'Lock', variant: 'warning' };
        case 'revoked':
            return { label: 'Revoke', variant: 'danger' };
        default:
            return { label: targetStatus, variant: 'primary' };
    }
}
