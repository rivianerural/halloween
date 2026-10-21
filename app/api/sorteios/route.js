import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await db().from('sorteios').select('*').order('sorteado_em', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ sorteios: data });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
