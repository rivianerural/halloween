// Lê a planilha de apuração direto do Google Sheets, sem cache, a cada acesso.
// Dois jeitos de dar acesso:
//  1. Simples: compartilhar a planilha como "Qualquer pessoa com o link: Leitor".
//  2. Privado: criar uma conta de serviço no Google Cloud, compartilhar a planilha com o e-mail dela
//     e colar o JSON da chave na variável GOOGLE_SERVICE_ACCOUNT_JSON. Se ela existir, é usada.
import crypto from 'crypto';
// Layout esperado em cada aba de evento (o mesmo da planilha de apuração):
//   B2 = GMV realizado | B3 = Meta | tabela a partir da linha 12: A Nome, B Carimbo, C Palpite, D Diferença, E Posição, F Resultado

const SHEET_ID = () => process.env.GOOGLE_SHEET_ID || '13G74uQKP-gQyFReCVzn9QsBxFvyA46hJ447r9HqwP0A';

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

let tokenCache = { token: null, exp: 0 };
async function googleToken() {
  if (tokenCache.token && Date.now() < tokenCache.exp - 60000) return tokenCache.token;
  const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
    cache: 'no-store',
  });
  const j = await res.json();
  if (!res.ok) throw new Error('Não consegui autenticar no Google com a conta de serviço.');
  tokenCache = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

async function readRangeApi(aba, range) {
  const token = await googleToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID()}/values/${encodeURIComponent(`'${aba}'!${range}`)}?valueRenderOption=FORMATTED_VALUE`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Não consegui ler a aba "${aba}" (${res.status}). Confira se a planilha foi compartilhada com o e-mail da conta de serviço.`);
  const j = await res.json();
  return j.values || [];
}

async function readRange(aba, range) {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return readRangeApi(aba, range);
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID()}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(aba)}&range=${range}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Não consegui ler a aba "${aba}" da planilha (${res.status}). Confira se ela está compartilhada com qualquer pessoa com o link.`);
  const text = await res.text();
  if (text.trim().startsWith('<')) throw new Error(`A planilha não está acessível. Compartilhe como "Qualquer pessoa com o link: Leitor".`);
  return parseCSV(text);
}

export async function lerEvento(evento) {
  const [topo, tabela] = await Promise.all([
    readRange(evento.aba, 'B2:B3'),
    readRange(evento.aba, 'A12:F200'),
  ]);
  const gmv = (topo[0]?.[0] || '').trim();
  const meta = (topo[1]?.[0] || '').trim();
  const lanterna = tabela
    .filter((r) => r[0] && /travessura/i.test(r[5] || ''))
    .map((r) => ({
      nome: r[0].trim(),
      palpite: (r[2] || '').trim(),
      diferenca: (r[3] || '').trim(),
      posicao: parseInt(r[4], 10) || null,
    }))
    .sort((a, b) => (a.posicao || 0) - (b.posicao || 0));
  return { gmv, meta, lanterna };
}
