import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { CreateBlueprintRequest } from '@/lib/types';

// GET /api/blueprints - List all blueprints
export async function GET() {
    try {
        const blueprints = await prisma.blueprint.findMany({
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { contracts: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: blueprints });
    } catch (error) {
        console.error('Error fetching blueprints:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch blueprints' },
            { status: 500 }
        );
    }
}

// POST /api/blueprints - Create a new blueprint
export async function POST(request: NextRequest) {
    try {
        const body: CreateBlueprintRequest = await request.json();

        // Validation
        if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'Blueprint name is required' },
                { status: 400 }
            );
        }

        if (!body.fields || !Array.isArray(body.fields) || body.fields.length === 0) {
            return NextResponse.json(
                { success: false, error: 'At least one field is required' },
                { status: 400 }
            );
        }

        // Validate field types
        const validTypes = ['text', 'date', 'signature', 'checkbox'];
        for (const field of body.fields) {
            if (!validTypes.includes(field.type)) {
                return NextResponse.json(
                    { success: false, error: `Invalid field type: ${field.type}` },
                    { status: 400 }
                );
            }
            if (!field.label || typeof field.label !== 'string') {
                return NextResponse.json(
                    { success: false, error: 'Each field must have a label' },
                    { status: 400 }
                );
            }
        }

        const blueprint = await prisma.blueprint.create({
            data: {
                name: body.name.trim(),
                description: body.description?.trim() || null,
                fields: {
                    create: body.fields.map((field, index) => ({
                        type: field.type,
                        label: field.label.trim(),
                        positionX: field.positionX || 0,
                        positionY: field.positionY || 0,
                        order: field.order ?? index,
                    })),
                },
            },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        return NextResponse.json({ success: true, data: blueprint }, { status: 201 });
    } catch (error) {
        console.error('Error creating blueprint:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create blueprint' },
            { status: 500 }
        );
    }
}
