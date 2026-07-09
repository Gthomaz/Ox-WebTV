import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { data: notes, error } = await supabase
      .from('report_notes')
      .select('*')
      .eq('report_id', parseInt(params.id))
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(notes, { headers: corsHeaders() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await request.json();
    const { note, userId } = body;

    if (!note) {
      return NextResponse.json({ error: 'Nota é obrigatória' }, { status: 400, headers: corsHeaders() });
    }

    const { data: newNote, error } = await supabase
      .from('report_notes')
      .insert({
        report_id: parseInt(params.id),
        user_id: userId || null,
        note,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newNote, { status: 201, headers: corsHeaders() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}
