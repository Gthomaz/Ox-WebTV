import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { question, option_index } = await request.json();
    const voter_ip = request.headers.get('x-forwarded-for') || 'unknown';

    // 1. Tentar achar a enquete pelo título (como não temos o ID direto no frontend ainda)
    // Isso assume que o frontend envia a 'question' e o index da 'option' votada
    
    // Na nossa tabela manual broadcast_control não temos tabela de votos.
    // Vamos tentar salvar na tabela poll_votes (assumindo que scheduled_polls existe)
    let pollId = null;
    try {
       const { data: poll } = await supabase.from('scheduled_polls').select('id').eq('question', question).single();
       if (poll) pollId = poll.id;
    } catch(e) {}
    
    if (pollId) {
      await supabase.from('poll_votes').insert({
        poll_id: pollId,
        option_index: option_index,
        voter_ip: voter_ip
      });
    } else {
      // Se for uma enquete ad-hoc (só ativa no broadcast_control), nós precisaríamos criar um poll dinâmico.
      // Para manter simples, só salvamos se a tabela existir.
      console.warn("Enquete não encontrada no banco estruturado. Voto descartado (apenas interativo).");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
