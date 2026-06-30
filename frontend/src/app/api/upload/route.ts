import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { success: false, message: 'Upload local não é suportado no Cloudflare Edge. Por favor, use o R2.' },
    { status: 501 }
  );
}
