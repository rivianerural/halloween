import { NextResponse } from 'next/server';
import { getEvento } from '@/lib/eventos';
import { lerEvento } from '@/lib/sheet';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const evento = getEvento(params.slug);
  if (!evento) return NextResponse.json({ erro: 'Evento não encontrado.' }, { status: 404 });
  try {
    const { gmv, meta, lanterna } = await lerEvento(evento);
    const { data: sorteios, error } = await db().from('sorteios').select('*').eq('evento', evento.slug);
    if (error) throw error;
    const comStatus = lanterna.map((p) => ({ ...p, sorteio: sorteios.find((s) => s.pessoa === p.nome) || null }));
    return NextResponse.json({ evento, gmv, meta, lanterna: comStatus });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
