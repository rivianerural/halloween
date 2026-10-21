import { NextResponse } from 'next/server';
import { getEvento } from '@/lib/eventos';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { slug, pessoa, travessura } = await req.json().catch(() => ({}));
  const evento = getEvento(slug);
  if (!evento || !pessoa || travessura === undefined) return NextResponse.json({ erro: 'Dados incompletos.' }, { status: 400 });
  try {
    const { data: meu, error } = await db().from('sorteios').select('*').eq('evento', evento.slug).eq('pessoa', pessoa).maybeSingle();
    if (error) throw error;
    if (!meu) return NextResponse.json({ erro: 'Faça o sorteio primeiro.' }, { status: 400 });
    if (meu.travessura !== null) return NextResponse.json({ sorteio: meu });
    if (travessura !== meu.opcao_1 && travessura !== meu.opcao_2) {
      return NextResponse.json({ erro: 'Só dá para escolher uma das travessuras que você sorteou.' }, { status: 400 });
    }
    const { data, error: e2 } = await db().from('sorteios').update({ travessura, escolhida_em: new Date().toISOString() }).eq('id', meu.id).select().single();
    if (e2) throw e2;
    return NextResponse.json({ sorteio: data });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
