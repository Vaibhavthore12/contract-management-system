import {
    isValidTransition,
    getAllowedTransitions,
    isTerminalState,
    isEditable,
    getTransitionConfig,
} from '../lifecycle';
import { ContractStatus } from '../types';

describe('Lifecycle Functions', () => {
    describe('isValidTransition', () => {
        // Valid transitions from 'created'
        it('should allow transition from created to approved', () => {
            expect(isValidTransition('created', 'approved')).toBe(true);
        });

        it('should allow transition from created to revoked', () => {
            expect(isValidTransition('created', 'revoked')).toBe(true);
        });

        it('should not allow transition from created to sent', () => {
            expect(isValidTransition('created', 'sent')).toBe(false);
        });

        it('should not allow transition from created to locked', () => {
            expect(isValidTransition('created', 'locked')).toBe(false);
        });

        // Valid transitions from 'approved'
        it('should allow transition from approved to sent', () => {
            expect(isValidTransition('approved', 'sent')).toBe(true);
        });

        it('should allow transition from approved to revoked', () => {
            expect(isValidTransition('approved', 'revoked')).toBe(true);
        });

        it('should not allow transition from approved to locked', () => {
            expect(isValidTransition('approved', 'locked')).toBe(false);
        });

        // Valid transitions from 'sent'
        it('should allow transition from sent to signed', () => {
            expect(isValidTransition('sent', 'signed')).toBe(true);
        });

        it('should allow transition from sent to revoked', () => {
            expect(isValidTransition('sent', 'revoked')).toBe(true);
        });

        it('should not allow transition from sent to locked', () => {
            expect(isValidTransition('sent', 'locked')).toBe(false);
        });

        // Valid transitions from 'signed'
        it('should allow transition from signed to locked', () => {
            expect(isValidTransition('signed', 'locked')).toBe(true);
        });

        it('should not allow transition from signed to revoked', () => {
            expect(isValidTransition('signed', 'revoked')).toBe(false);
        });

        // Terminal states
        it('should not allow any transition from locked', () => {
            expect(isValidTransition('locked', 'revoked')).toBe(false);
            expect(isValidTransition('locked', 'created')).toBe(false);
        });

        it('should not allow any transition from revoked', () => {
            expect(isValidTransition('revoked', 'locked')).toBe(false);
            expect(isValidTransition('revoked', 'created')).toBe(false);
        });
    });

    describe('getAllowedTransitions', () => {
        it('should return [approved, revoked] for created status', () => {
            expect(getAllowedTransitions('created')).toEqual(['approved', 'revoked']);
        });

        it('should return [sent, revoked] for approved status', () => {
            expect(getAllowedTransitions('approved')).toEqual(['sent', 'revoked']);
        });

        it('should return [signed, revoked] for sent status', () => {
            expect(getAllowedTransitions('sent')).toEqual(['signed', 'revoked']);
        });

        it('should return [locked] for signed status', () => {
            expect(getAllowedTransitions('signed')).toEqual(['locked']);
        });

        it('should return empty array for locked status', () => {
            expect(getAllowedTransitions('locked')).toEqual([]);
        });

        it('should return empty array for revoked status', () => {
            expect(getAllowedTransitions('revoked')).toEqual([]);
        });
    });

    describe('isTerminalState', () => {
        it('should return true for locked status', () => {
            expect(isTerminalState('locked')).toBe(true);
        });

        it('should return true for revoked status', () => {
            expect(isTerminalState('revoked')).toBe(true);
        });

        it('should return false for created status', () => {
            expect(isTerminalState('created')).toBe(false);
        });

        it('should return false for approved status', () => {
            expect(isTerminalState('approved')).toBe(false);
        });

        it('should return false for sent status', () => {
            expect(isTerminalState('sent')).toBe(false);
        });

        it('should return false for signed status', () => {
            expect(isTerminalState('signed')).toBe(false);
        });
    });

    describe('isEditable', () => {
        it('should return true only for created status', () => {
            expect(isEditable('created')).toBe(true);
        });

        it('should return false for approved status', () => {
            expect(isEditable('approved')).toBe(false);
        });

        it('should return false for sent status', () => {
            expect(isEditable('sent')).toBe(false);
        });

        it('should return false for signed status', () => {
            expect(isEditable('signed')).toBe(false);
        });

        it('should return false for locked status', () => {
            expect(isEditable('locked')).toBe(false);
        });

        it('should return false for revoked status', () => {
            expect(isEditable('revoked')).toBe(false);
        });
    });

    describe('getTransitionConfig', () => {
        it('should return primary variant for approve', () => {
            const config = getTransitionConfig('approved');
            expect(config.label).toBe('Approve');
            expect(config.variant).toBe('primary');
        });

        it('should return primary variant for send', () => {
            const config = getTransitionConfig('sent');
            expect(config.label).toBe('Send');
            expect(config.variant).toBe('primary');
        });

        it('should return success variant for sign', () => {
            const config = getTransitionConfig('signed');
            expect(config.label).toBe('Sign');
            expect(config.variant).toBe('success');
        });

        it('should return warning variant for lock', () => {
            const config = getTransitionConfig('locked');
            expect(config.label).toBe('Lock');
            expect(config.variant).toBe('warning');
        });

        it('should return danger variant for revoke', () => {
            const config = getTransitionConfig('revoked');
            expect(config.label).toBe('Revoke');
            expect(config.variant).toBe('danger');
        });
    });

    describe('Complete Lifecycle Flow', () => {
        it('should follow valid lifecycle: created -> approved -> sent -> signed -> locked', () => {
            const statuses: ContractStatus[] = ['created', 'approved', 'sent', 'signed', 'locked'];

            for (let i = 0; i < statuses.length - 1; i++) {
                expect(isValidTransition(statuses[i], statuses[i + 1])).toBe(true);
            }
        });

        it('should allow revoke at any non-terminal state except signed', () => {
            expect(isValidTransition('created', 'revoked')).toBe(true);
            expect(isValidTransition('approved', 'revoked')).toBe(true);
            expect(isValidTransition('sent', 'revoked')).toBe(true);
            expect(isValidTransition('signed', 'revoked')).toBe(false);
        });

        it('should not allow skipping states', () => {
            expect(isValidTransition('created', 'sent')).toBe(false);
            expect(isValidTransition('created', 'signed')).toBe(false);
            expect(isValidTransition('created', 'locked')).toBe(false);
            expect(isValidTransition('approved', 'signed')).toBe(false);
            expect(isValidTransition('approved', 'locked')).toBe(false);
        });

        it('should not allow going backwards', () => {
            expect(isValidTransition('approved', 'created')).toBe(false);
            expect(isValidTransition('sent', 'approved')).toBe(false);
            expect(isValidTransition('signed', 'sent')).toBe(false);
            expect(isValidTransition('locked', 'signed')).toBe(false);
        });
    });
});
