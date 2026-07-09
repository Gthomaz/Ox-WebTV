import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400, headers: corsHeaders() });
    }

    // Gerar nome único
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Converter File para Blob/ArrayBuffer (Next.js 13+)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Fazer upload para o Supabase Storage (bucket 'videos')
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Storage upload erro:", error);
      throw error;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl }, { headers: corsHeaders() });
  } catch (error: any) {
    console.error("Upload Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}
