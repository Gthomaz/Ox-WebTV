import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({ 
    status: 'success', 
    message: 'Backend simulado: Controle da grade da OX WebTV' 
  });
}
