import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 0;

export async function GET() {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    const todayDateStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;

    const { data: schedule } = await supabase
      .from('daily_schedule')
      .select('id')
      .eq('schedule_date', todayDateStr)
      .single();

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (!schedule) {
      return NextResponse.json({ items: [] }, { headers });
    }

    const { data: items } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('daily_schedule_id', schedule.id)
      .order('start_time_seconds', { ascending: true });

    return NextResponse.json({ items: items || [] }, { headers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
