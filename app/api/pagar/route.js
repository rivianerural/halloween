import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  // Sem senha: qualquer pessoa do time pode marcar como paga pelo painel.
  const { id, desfazer, travessura } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ erro: 'Travessura não informada.' }, { status: 400 });
  try {
    let campos = { paga_em: desfazer ? null : new Date().toISOString() };
    if (!desfazer) {
      const { data: atual, error: e0 } = await db().from('sorteios').select('*').eq('id', id).single();
      if (e0) throw e0;
      // Quem pagou sem confirmar fica com a travessura que sorteou; com duas opções, o painel diz qual foi.
      if (atual.travessura === null) {
        const paga = atual.opcao_2 === null ? atual.opcao_1 : travessura;
        if (paga !== atual.opcao_1 && paga !== atual.opcao_2) {
          return NextResponse.json({ erro: 'Escolha qual das duas travessuras foi paga.' }, { status: 400 });
        }
        campos = { ...campos, travessura: paga, escolhida_em: new Date().toISOString() };
      }
    }
    const { data, error } = await db()
      .from('sorteios')
      .update(campos)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ sorteio: data });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
