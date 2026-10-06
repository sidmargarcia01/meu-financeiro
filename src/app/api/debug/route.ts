import { NextResponse } from 'next/server'
export async function GET() { return NextResponse.json({ error: 'Não encontrado' }, { status: 404 }) }
