import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'docs', 'openapi.json');
        const content = readFileSync(filePath, 'utf-8');
        return new NextResponse(content, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch {
        return NextResponse.json(
            { error: 'OpenAPI spec not found' },
            { status: 404 }
        );
    }
}
