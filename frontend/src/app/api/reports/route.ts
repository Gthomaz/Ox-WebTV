import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Habilita CORS para permitir que o frontend do "OX TV Denuncias" acesse a API
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET() {
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*, report_media(*), report_comments(*), report_notes(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(reports, { headers: corsHeaders() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, latitude, longitude, mediaItems, phone, email, location_address } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400, headers: corsHeaders() });
    }

    // Gerar um número de protocolo (ex: REQ-20260708-XXXX)
    const date = new Date();
    const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const protocol_number = `REQ-${dateString}-${randomSuffix}`;

    // Inserir denúncia
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({ title, description, latitude, longitude, phone, email, location_address, protocol_number })
      .select()
      .single();

    if (reportError) throw reportError;

    // Inserir mídias se houver
    if (mediaItems && Array.isArray(mediaItems) && mediaItems.length > 0) {
      const mediaToInsert = mediaItems.map((url: string) => ({
        report_id: report.id,
        media_url: url,
        media_type: url.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image',
      }));

      const { error: mediaError } = await supabase
        .from('report_media')
        .insert(mediaToInsert);

      if (mediaError) throw mediaError;
    }

    return NextResponse.json(report, { status: 201, headers: corsHeaders() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}
