import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the public/videos directory exists
    const dirPath = join(process.cwd(), 'public', 'videos');
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    const path = join(dirPath, file.name);

    await writeFile(path, buffer);
    return NextResponse.json({ success: true, message: `Upload 100%! O arquivo está disponível em /videos/${file.name}` });
  } catch (error) {
    console.error('Upload falhou:', error);
    return NextResponse.json({ success: false, message: 'Erro interno ao salvar o arquivo.' }, { status: 500 });
  }
}
