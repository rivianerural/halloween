import { NextResponse } from 'next/server';
import { getEvento } from '@/lib/eventos';
import { lerEvento } from '@/lib/sheet';
import { db } from '@/lib/supabase';
import { TRAVESSURAS } from '@/lib/travessuras';

export const dynamic = 'force-dynamic';

// 1º clique: sorteia a opção 1. 2º clique (se a pessoa não gostou): sorteia a opção 2.
// Depois disso, não sorteia mais: a pessoa escolhe entre as duas em /api/escolher.
export async function POST(req) {
  const { slug, pessoa } = await req.json().catch(() => ({}));
  const evento = getEvento(slug);
  if (!evento || !pessoa) return NextResponse.json({ erro: 'Escolha o evento e o seu nome.' }, { status: 400 });

  try {
    const { lanterna } = await lerEvento(evento);
    if (!lanterna.some((p) => p.nome === pessoa)) {
      return NextResponse.json({ erro: 'Esse nome não está entre as travessuras deste evento.' }, { status: 403 });
    }

    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const { data: existentes, error } = await db().from('sorteios').select('*').eq('evento', evento.slug);
      if (error) throw error;
      const meu = existentes.find((s) => s.pessoa === pessoa);

      // Já escolheu ou já usou as duas chances: devolve o que tem.
      if (meu && (meu.travessura !== null || meu.opcao_2 !== null)) return NextResponse.json({ sorteio: meu });

      // Não repete nada que já saiu para outra pessoa do evento, nem a própria opção 1.
      const ocupadas = new Set();
      existentes.forEach((s) => [s.opcao_1, s.opcao_2, s.travessura].forEach((v) => v !== null && ocupadas.add(v)));
      const livres = TRAVESSURAS.map((_, i) => i).filter((i) => !ocupadas.has(i));
      const sorteada = livres[Math.floor(Math.random() * livres.length)];

      if (!meu) {
        const { data, error: e2 } = await db().from('sorteios').insert({ evento: evento.slug, pessoa, opcao_1: sorteada }).select().single();
        if (!e2) return NextResponse.json({ sorteio: data });
        if (e2.code !== '23505') throw e2; // sorteou ao mesmo tempo em outra aba: tenta de novo
      } else {
        const { data, error: e2 } = await db().from('sorteios').update({ opcao_2: sorteada }).eq('id', meu.id).is('opcao_2', null).select().maybeSingle();
        if (e2) throw e2;
        if (data) return NextResponse.json({ sorteio: data });
      }
    }
    return NextResponse.json({ erro: 'Não consegui sortear agora. Tente de novo.' }, { status: 409 });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
