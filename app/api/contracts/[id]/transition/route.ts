import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { TransitionContractRequest, ContractStatus } from '@/lib/types';
import { isValidTransition, getAllowedTransitions } from '@/lib/lifecycle';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/contracts/:id/transition - Transition contract status
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body: TransitionContractRequest = await request.json();

        // Validation
        if (!body.targetStatus) {
            return NextResponse.json(
                { success: false, error: 'Target status is required' },
                { status: 400 }
            );
        }

        const validStatuses: ContractStatus[] = ['created', 'approved', 'sent', 'signed', 'locked', 'revoked'];
        if (!validStatuses.includes(body.targetStatus)) {
            return NextResponse.json(
                { success: false, error: `Invalid target status: ${body.targetStatus}` },
                { status: 400 }
            );
        }

        // Check if contract exists
        const contract = await prisma.contract.findUnique({
            where: { id },
            select: { id: true, status: true, name: true },
        });

        if (!contract) {
            return NextResponse.json(
                { success: false, error: 'Contract not found' },
                { status: 404 }
            );
        }

        const currentStatus = contract.status as ContractStatus;
        const targetStatus = body.targetStatus;

        // Validate transition
        if (!isValidTransition(currentStatus, targetStatus)) {
            const allowed = getAllowedTransitions(currentStatus);
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid transition from '${currentStatus}' to '${targetStatus}'. Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)'}`,
                },
                { status: 400 }
            );
        }

        // Perform transition
        const updatedContract = await prisma.contract.update({
            where: { id },
            data: { status: targetStatus },
            include: {
                blueprint: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                fieldValues: {
                    include: {
                        blueprintField: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedContract,
            message: `Contract '${contract.name}' transitioned from '${currentStatus}' to '${targetStatus}'`,
        });
    } catch (error) {
        console.error('Error transitioning contract:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to transition contract' },
            { status: 500 }
        );
    }
}

// GET /api/contracts/:id/transition - Get allowed transitions
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const contract = await prisma.contract.findUnique({
            where: { id },
            select: { id: true, status: true },
        });

        if (!contract) {
            return NextResponse.json(
                { success: false, error: 'Contract not found' },
                { status: 404 }
            );
        }

        const currentStatus = contract.status as ContractStatus;
        const allowedTransitions = getAllowedTransitions(currentStatus);

        return NextResponse.json({
            success: true,
            data: {
                currentStatus,
                allowedTransitions,
            },
        });
    } catch (error) {
        console.error('Error fetching transitions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch transitions' },
            { status: 500 }
        );
    }
}
