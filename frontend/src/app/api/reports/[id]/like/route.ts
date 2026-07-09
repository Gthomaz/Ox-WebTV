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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Fetch current likes
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('likes_count')
      .eq('id', params.id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Increment likes
    const newLikes = (report.likes_count || 0) + 1;

    const { error: updateError } = await supabase
      .from('reports')
      .update({ likes_count: newLikes })
      .eq('id', params.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, likes_count: newLikes }, { headers: corsHeaders() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}
