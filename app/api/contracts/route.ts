import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { CreateContractRequest, STATUS_FILTERS, StatusFilter } from '@/lib/types';

// GET /api/contracts - List contracts with optional filtering
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const filter = (searchParams.get('filter') as StatusFilter) || 'all';
        const blueprintId = searchParams.get('blueprintId');

        const statusFilters = STATUS_FILTERS[filter] || STATUS_FILTERS.all;

        const contracts = await prisma.contract.findMany({
            where: {
                status: { in: statusFilters },
                ...(blueprintId && { blueprintId }),
            },
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
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: contracts });
    } catch (error) {
        console.error('Error fetching contracts:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch contracts' },
            { status: 500 }
        );
    }
}

// POST /api/contracts - Create a contract from a blueprint
export async function POST(request: NextRequest) {
    try {
        const body: CreateContractRequest = await request.json();

        // Validation
        if (!body.blueprintId) {
            return NextResponse.json(
                { success: false, error: 'Blueprint ID is required' },
                { status: 400 }
            );
        }

        if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'Contract name is required' },
                { status: 400 }
            );
        }

        // Check if blueprint exists
        const blueprint = await prisma.blueprint.findUnique({
            where: { id: body.blueprintId },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!blueprint) {
            return NextResponse.json(
                { success: false, error: 'Blueprint not found' },
                { status: 404 }
            );
        }

        // Create contract with field values
        const contract = await prisma.contract.create({
            data: {
                name: body.name.trim(),
                blueprintId: body.blueprintId,
                status: 'created',
                fieldValues: {
                    create: blueprint.fields.map((field) => ({
                        blueprintFieldId: field.id,
                        value: body.fieldValues?.[field.id] || '',
                    })),
                },
            },
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

        return NextResponse.json({ success: true, data: contract }, { status: 201 });
    } catch (error) {
        console.error('Error creating contract:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create contract' },
            { status: 500 }
        );
    }
}
