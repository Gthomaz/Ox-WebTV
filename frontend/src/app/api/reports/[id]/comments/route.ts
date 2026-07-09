import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: comments, error } = await supabase
      .from('report_comments')
      .select('*')
      .eq('report_id', params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(comments, { headers: corsHeaders() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { author_name, content } = body;

    if (!author_name || !content) {
      return NextResponse.json({ error: 'Nome e comentário são obrigatórios' }, { status: 400, headers: corsHeaders() });
    }

    const { data: comment, error } = await supabase
      .from('report_comments')
      .insert({
        report_id: params.id,
        author_name,
        content
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(comment, { headers: corsHeaders() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}
