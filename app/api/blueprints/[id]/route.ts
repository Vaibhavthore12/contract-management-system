import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { CreateBlueprintRequest } from '@/lib/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/blueprints/:id - Get a single blueprint
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const blueprint = await prisma.blueprint.findUnique({
            where: { id },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { contracts: true },
                },
            },
        });

        if (!blueprint) {
            return NextResponse.json(
                { success: false, error: 'Blueprint not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: blueprint });
    } catch (error) {
        console.error('Error fetching blueprint:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch blueprint' },
            { status: 500 }
        );
    }
}

// PUT /api/blueprints/:id - Update a blueprint
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body: Partial<CreateBlueprintRequest> = await request.json();

        // Check if blueprint exists
        const existing = await prisma.blueprint.findUnique({
            where: { id },
            include: { contracts: { take: 1 } },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Blueprint not found' },
                { status: 404 }
            );
        }

        // If blueprint has contracts, don't allow field structure changes
        if (existing.contracts.length > 0 && body.fields) {
            return NextResponse.json(
                { success: false, error: 'Cannot modify fields of a blueprint with existing contracts' },
                { status: 400 }
            );
        }

        // Start transaction for update
        const blueprint = await prisma.$transaction(async (tx) => {
            // Update fields if provided and no contracts exist
            if (body.fields && body.fields.length > 0) {
                // Delete existing fields
                await tx.blueprintField.deleteMany({
                    where: { blueprintId: id },
                });

                // Create new fields
                await tx.blueprintField.createMany({
                    data: body.fields.map((field, index) => ({
                        blueprintId: id,
                        type: field.type,
                        label: field.label.trim(),
                        positionX: field.positionX || 0,
                        positionY: field.positionY || 0,
                        order: field.order ?? index,
                    })),
                });
            }

            // Update blueprint
            return tx.blueprint.update({
                where: { id },
                data: {
                    ...(body.name && { name: body.name.trim() }),
                    ...(body.description !== undefined && { description: body.description?.trim() || null }),
                },
                include: {
                    fields: {
                        orderBy: { order: 'asc' },
                    },
                },
            });
        });

        return NextResponse.json({ success: true, data: blueprint });
    } catch (error) {
        console.error('Error updating blueprint:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update blueprint' },
            { status: 500 }
        );
    }
}

// DELETE /api/blueprints/:id - Delete a blueprint
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Check if blueprint has contracts
        const existing = await prisma.blueprint.findUnique({
            where: { id },
            include: { _count: { select: { contracts: true } } },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Blueprint not found' },
                { status: 404 }
            );
        }

        if (existing._count.contracts > 0) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete blueprint with existing contracts' },
                { status: 400 }
            );
        }

        await prisma.blueprint.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, data: { deleted: true } });
    } catch (error) {
        console.error('Error deleting blueprint:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete blueprint' },
            { status: 500 }
        );
    }
}
