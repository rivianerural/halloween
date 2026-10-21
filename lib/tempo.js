import { PRAZO_HORAS } from './travessuras';

export const prazoDe = (s) => new Date(new Date(s.sorteado_em).getTime() + PRAZO_HORAS * 3600 * 1000);

export function contagem(ms) {
  const neg = ms < 0;
  const t = Math.abs(Math.floor(ms / 1000));
  const h = String(Math.floor(t / 3600)).padStart(2, '0');
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const s = String(t % 60).padStart(2, '0');
  return { texto: `${h}:${m}:${s}`, neg };
}

export function dataHora(d) {
  const f = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}, às ${p.hour}h${p.minute}`;
}

export function status(s, agora) {
  if (s.paga_em) return 'paga';
  // Quem ainda não confirmou já conta no prazo com o que sorteou.
  const falta = prazoDe(s).getTime() - agora;
  if (falta < 0) return 'atrasada';
  if (falta < 2 * 3600 * 1000) return 'breve';
  return 'prazo';
}

export const STATUS_LABEL = { prazo: 'No prazo', breve: 'Vence em breve', atrasada: 'Atrasada', paga: 'Paga' };
