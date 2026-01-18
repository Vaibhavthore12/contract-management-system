import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { UpdateContractValuesRequest } from '@/lib/types';
import { isEditable } from '@/lib/lifecycle';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/contracts/:id - Get a single contract
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                blueprint: {
                    include: {
                        fields: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
                fieldValues: {
                    include: {
                        blueprintField: true,
                    },
                },
            },
        });

        if (!contract) {
            return NextResponse.json(
                { success: false, error: 'Contract not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: contract });
    } catch (error) {
        console.error('Error fetching contract:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch contract' },
            { status: 500 }
        );
    }
}

// PUT /api/contracts/:id - Update contract field values
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body: UpdateContractValuesRequest = await request.json();

        // Check if contract exists
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

        // Check if contract is editable
        if (!isEditable(contract.status as 'created' | 'approved' | 'sent' | 'signed' | 'locked' | 'revoked')) {
            return NextResponse.json(
                { success: false, error: 'Contract is not editable in current status' },
                { status: 400 }
            );
        }

        // Update field values
        if (body.fieldValues) {
            for (const [fieldId, value] of Object.entries(body.fieldValues)) {
                await prisma.contractFieldValue.updateMany({
                    where: {
                        contractId: id,
                        blueprintFieldId: fieldId,
                    },
                    data: { value },
                });
            }
        }

        // Fetch updated contract
        const updatedContract = await prisma.contract.findUnique({
            where: { id },
            include: {
                blueprint: {
                    include: {
                        fields: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
                fieldValues: {
                    include: {
                        blueprintField: true,
                    },
                },
            },
        });

        return NextResponse.json({ success: true, data: updatedContract });
    } catch (error) {
        console.error('Error updating contract:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update contract' },
            { status: 500 }
        );
    }
}
