import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { id, pin, desfazer } = await req.json().catch(() => ({}));
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ erro: 'Senha incorreta.' }, { status: 401 });
  }
  try {
    const { data, error } = await db()
      .from('sorteios')
      .update({ paga_em: desfazer ? null : new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ sorteio: data });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
