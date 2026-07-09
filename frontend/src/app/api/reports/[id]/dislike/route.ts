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
    // 1. Fetch current dislikes
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('dislikes_count')
      .eq('id', params.id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Increment dislikes
    const newDislikes = (report.dislikes_count || 0) + 1;

    const { error: updateError } = await supabase
      .from('reports')
      .update({ dislikes_count: newDislikes })
      .eq('id', params.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, dislikes_count: newDislikes }, { headers: corsHeaders() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}
