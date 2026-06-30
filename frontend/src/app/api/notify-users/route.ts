import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { pollId } = await request.json();

    if (!pollId) {
      return NextResponse.json({ error: 'Missing pollId' }, { status: 400 });
    }

    // 1. Fetch the poll and candidates to find the winner
    const { data: candidates } = await supabase
      .from('poll_candidates')
      .select('*')
      .eq('poll_id', pollId)
      .order('votes_count', { ascending: false });

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ error: 'No candidates found' }, { status: 404 });
    }

    const winner = candidates[0]; // Movie with most votes

    // 2. Fetch all registered users
    const { data: users } = await supabase.from('user_profiles').select('*');

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users to notify, but poll closed.', winner: winner.title }, { status: 200 });
    }

    // 3. Close the poll
    await supabase.from('movie_polls').update({ is_active: false, winner_movie_id: winner.id }).eq('id', pollId);

    // 4. Mock sending SMS and E-mail
    // EM PRODUÇÃO: Integrar com Twilio e Resend aqui.
    console.log(`[NOTIFY_USERS_API] Encerrando Enquete #${pollId}. Vencedor: ${winner.title}`);
    console.log(`[NOTIFY_USERS_API] Preparando disparo para ${users.length} usuários.`);

    for (const user of users) {
      const emailBody = `Olá ${user.name},\nO filme vencedor da semana foi "${winner.title}" com ${winner.votes_count} votos!\n\nSerá exibido nesta Sexta às 20h na OX WebTV. Não perca!`;
      
      // Simula o disparo de E-mail (Ex: Resend API)
      if (user.email) {
        console.log(`✉️ [EMAIL SENT] To: ${user.email} -> ${emailBody}`);
      }

      // Simula o disparo de SMS (Ex: Twilio API)
      if (user.phone) {
        console.log(`📱 [SMS SENT] To: ${user.phone} -> O filme vencedor foi ${winner.title}. Sexta as 20h!`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      winner: winner.title,
      notifiedUsers: users.length,
      message: 'Notificações enviadas com sucesso (modo simulado).' 
    });

  } catch (error: any) {
    console.error('Error notifying users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
