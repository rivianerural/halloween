'use client';

import { useEffect, useRef, useState } from 'react';
import { TRAVESSURAS } from '@/lib/travessuras';
import { prazoDe, contagem, dataHora } from '@/lib/tempo';

const reduzMovimento = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function SorteioClient({ eventos }) {
  const [tela, setTela] = useState('escolher');
  const [slug, setSlug] = useState('');
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [pessoa, setPessoa] = useState('');
  const [sorteio, setSorteio] = useState(null);
  const [abertas, setAbertas] = useState(null);
  const [verPalpites, setVerPalpites] = useState(false);
  const palpitesRef = useRef(null);

  const evento = eventos.find((e) => e.slug === slug);

  useEffect(() => {
    const el = palpitesRef.current;
    if (!verPalpites || !el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: reduzMovimento() ? 'auto' : 'smooth' });
  }, [verPalpites]);

  useEffect(() => {
    fetch('/api/sorteios').then((r) => r.json()).then((j) => {
      if (j.sorteios) setAbertas(j.sorteios.filter((s) => !s.paga_em).length);
    }).catch(() => {});
  }, [tela]);

  async function carregar(novo) {
    setSlug(novo); setPessoa(''); setDados(null); setErro('');
    if (!novo) return;
    setCarregando(true);
    try {
      const r = await fetch(`/api/evento/${novo}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro || 'Não consegui carregar o evento.');
      setDados(j);
    } catch (e) { setErro(e.message); }
    finally { setCarregando(false); }
  }

  const escolhida = dados?.lanterna.find((p) => p.nome === pessoa);
  const meu = escolhida?.sorteio;
  const encerrado = meu && (meu.travessura !== null || meu.opcao_2 !== null);

  async function sortear() {
    if (!escolhida) return;
    if (meu && encerrado) { setSorteio(meu); setTela('resultado'); return; }
    if (meu && !sorteio) { setSorteio(meu); setTela('resultado'); return; }
    await novoSorteio();
  }

  async function novoSorteio() {
    setErro(''); setSorteio(null); setTela('sorteando');
    try {
      const r = await fetch('/api/sortear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, pessoa }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro || 'Não consegui sortear.');
      setSorteio(j.sorteio);
      setDados((d) => d && ({ ...d, lanterna: d.lanterna.map((p) => (p.nome === pessoa ? { ...p, sorteio: j.sorteio } : p)) }));
    } catch (e) { setErro(e.message); setTela('escolher'); }
  }

  async function escolher(t) {
    const r = await fetch('/api/escolher', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, pessoa, travessura: t }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.erro || 'Não consegui salvar sua escolha.');
    setSorteio(j.sorteio);
  }

  async function voltar() {
    setTela('escolher'); setSorteio(null);
    await carregar(slug);
  }

  if (tela === 'sorteando') {
    const alvo = sorteio ? (sorteio.opcao_2 ?? sorteio.opcao_1) : null;
    return <Sorteando evento={evento} pessoa={pessoa} alvo={alvo} onFim={() => setTela('resultado')} />;
  }
  if (tela === 'resultado' && sorteio) {
    const outra = dados?.lanterna.find((p) => p.nome !== pessoa);
    return <Resultado evento={evento} pessoa={escolhida || { nome: pessoa }} sorteio={sorteio} outra={outra} onVoltar={voltar} onEscolher={escolher} onDeNovo={novoSorteio} />;
  }

  const semResultado = dados && dados.lanterna.length === 0;

  return (
    <div className="wrap">
      <header className="top">
        <img className="logo" src="/img/erural.png" alt="erural" />
        <a className="pill" href="/painel">Travessuras em aberto {abertas ? <span className="count">{abertas}</span> : null}</a>
      </header>

      <main className="hero">
        <div className="hero-text">
          <img className="titulo-img" src="/img/titulo.png" alt="Doçuras ou Travessuras" />
          <p className="lede">Ficou na lanterna? Escolha seu nome e sorteie sua travessura.</p>
          <p className="sub">Os 2 palpites mais distantes do GMV realizado de cada evento pagam uma travessura. Cada pessoa sorteia a sua e tem 24 horas para pagar.</p>
        </div>

        <section className="card" aria-live="polite">
          <label className="field">Evento
            <select className="select" value={slug} onChange={(e) => carregar(e.target.value)}>
              <option value="">Escolha o evento</option>
              {eventos.map((e) => <option key={e.slug} value={e.slug}>{e.nome} | {e.data}</option>)}
            </select>
          </label>

          {carregando && <p className="aviso">Buscando o resultado na planilha...</p>}
          {erro && <p className="erro">{erro}</p>}

          {dados && (
            <div className="stats">
              <div className="stat"><small>Meta</small><b>{dados.meta || 'a definir'}</b></div>
              <div className="stat"><small>GMV realizado</small><b>{dados.gmv || 'em apuração'}</b></div>
            </div>
          )}

          {semResultado && <p className="aviso">O resultado deste evento ainda não saiu. Apuração: {evento.apuracao}.</p>}

          {dados && dados.lanterna.length > 0 && (
            <div className="pessoas" role="radiogroup" aria-label="Quem é você?">
              <span className="label">Quem é você?</span>
              {dados.lanterna.map((p) => (
                <label key={p.nome} className={`pessoa${pessoa === p.nome ? ' on' : ''}`}>
                  <input type="radio" name="pessoa" checked={pessoa === p.nome} onChange={() => setPessoa(p.nome)} />
                  <span className="pos">{p.posicao ? `${p.posicao}º` : ''}</span>
                  <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <span className="pessoa-nome">{p.nome}</span>
                    {p.sorteio && <span className="tag">{p.sorteio.travessura !== null ? 'Já sorteou' : 'Escolhendo'}</span>}
                    <span className="pessoa-info" style={{ display: 'block' }}>Palpite {p.palpite} | errou por {p.diferenca}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {dados && dados.lanterna.length > 0 && (
            <button className="go" disabled={!escolhida} onClick={sortear}>
              {!meu ? 'Sortear minha travessura' : meu.travessura !== null ? 'Ver minha travessura' : 'Continuar meu sorteio'}
            </button>
          )}

          {dados && dados.ranking?.length > 0 && (
            <button className="ver" aria-expanded={verPalpites} aria-controls="palpites" onClick={() => setVerPalpites((v) => !v)}>
              {verPalpites ? 'Esconder palpites' : `Ver palpites e ranking (${dados.ranking.length})`}
            </button>
          )}
        </section>
      </main>

      {verPalpites && dados && dados.ranking?.length > 0 && (
        <section className="palpites" id="palpites" ref={palpitesRef} aria-labelledby="palpites-titulo">
          <div className="palpites-head">
            <h2 id="palpites-titulo">Palpites e ranking</h2>
            <p>{evento.nome} | {dados.gmv ? `GMV realizado ${dados.gmv}` : `O ranking sai na apuração: ${evento.apuracao}.`}</p>
          </div>
          <ol className="ranking">
            {dados.ranking.map((p, i) => (
              <li key={`${p.nome}-${i}`} className={`rank${p.resultado ? ` ${p.resultado}` : ''}`}>
                <span className="pos">{p.posicao ? `${p.posicao}º` : '-'}</span>
                <span className="rank-nome">
                  {p.nome}
                  {p.resultado && <span className={`tag ${p.resultado}`}>{p.resultado === 'docura' ? '🍬 Doçura' : '🦇 Travessura'}</span>}
                </span>
                <span className="rank-num"><small>Palpite</small>{p.palpite || '-'}</span>
                <span className="rank-num"><small>Errou por</small>{p.diferenca || '-'}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Sorteando({ evento, pessoa, alvo, onFim }) {
  const [i, setI] = useState(0);
  const alvoRef = useRef(alvo);
  alvoRef.current = alvo;
  const fimRef = useRef(onFim);
  fimRef.current = onFim;

  useEffect(() => {
    let vivo = true, passo = 0, t;
    const minimo = reduzMovimento() ? 2 : 28;
    const girar = () => {
      if (!vivo) return;
      passo++;
      if (passo >= minimo && alvoRef.current !== null) {
        setI(alvoRef.current);
        t = setTimeout(() => vivo && fimRef.current(), 1100);
        return;
      }
      setI((v) => (v + 1) % TRAVESSURAS.length);
      const atraso = passo < minimo - 8 ? 70 : 70 + (passo - (minimo - 8)) * 35;
      t = setTimeout(girar, Math.min(atraso, 400));
    };
    t = setTimeout(girar, 300);
    return () => { vivo = false; clearTimeout(t); };
  }, []);

  const n = TRAVESSURAS.length;
  return (
    <div className="noite">
      <img className="lua" src="/img/lua.png" alt="" aria-hidden="true" />
      <header className="noite-top">
        <img className="logo" src="/img/erural.png" alt="erural" />
        <span>{evento?.nome}</span>
      </header>
      <div className="palco" aria-live="polite">
        <span style={{ fontSize: 16, fontWeight: 700 }}>Boa sorte, {pessoa}!</span>
        <h1>Sorteando sua travessura</h1>
        <div className="reel">
          <div className="fora" aria-hidden="true">{TRAVESSURAS[(i - 1 + n) % n].titulo}</div>
          <div className="dentro">{TRAVESSURAS[i].titulo}</div>
          <div className="fora" aria-hidden="true">{TRAVESSURAS[(i + 1) % n].titulo}</div>
        </div>
        <img className="mascote" src="/img/maioralzinho.png" alt="Maioralzinho de vampiro" />
      </div>
    </div>
  );
}

function Cartao({ t, pessoa, children }) {
  return (
    <article className="trav">
      <div className="quem">
        <span className="pos">{pessoa.posicao ? `${pessoa.posicao}º` : ''}</span>
        <div><small>Paga a travessura</small><b>{pessoa.nome}</b></div>
      </div>
      <h2 className="trav-titulo">{t.titulo}</h2>
      <div className="modo"><small>No escritório</small><p>{t.escritorio}</p></div>
      <div className="modo"><small>De casa</small><p>{t.casa}</p></div>
      {children}
    </article>
  );
}

function Resultado({ evento, pessoa, sorteio, outra, onVoltar, onEscolher, onDeNovo }) {
  const [agora, setAgora] = useState(Date.now());
  const [nota, setNota] = useState('');
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(t); }, []);

  const prazo = prazoDe(sorteio);
  const c = contagem(prazo.getTime() - agora);
  const atrasada = !sorteio.paga_em && c.neg;
  const decidido = sorteio.travessura !== null;
  const opcoes = [sorteio.opcao_1, sorteio.opcao_2].filter((v) => v !== null && v !== undefined);

  async function escolher(i) {
    setSalvando(true); setNota('');
    try { await onEscolher(i); } catch (e) { setNota(e.message); } finally { setSalvando(false); }
  }

  async function copiar() {
    const t = TRAVESSURAS[sorteio.travessura];
    const texto = `🦇 Travessura de ${pessoa.nome} (${evento.nome})\n*${t.titulo}*\n🏢 No escritório: ${t.escritorio}\n🏠 De casa: ${t.casa}\n⏰ Paga até ${dataHora(prazo)}`;
    try { await navigator.clipboard.writeText(texto); setNota('Copiado! É só colar no grupo.'); }
    catch { setNota('Não deu para copiar automaticamente. Selecione o texto e copie.'); }
  }

  const blocoPrazo = sorteio.paga_em ? (
    <div className="prazo"><div><small>Status</small><span className="relogio">Paga!</span></div></div>
  ) : (
    <div className={`prazo${atrasada ? ' atrasada' : ''}${decidido ? '' : ' mini'}`}>
      <div>
        <small>{atrasada ? 'Atrasada há' : decidido ? 'Tempo para pagar' : 'O prazo de 24h já está correndo'}</small>
        <span className="relogio">{c.texto}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }}>Paga até {dataHora(prazo)}</div>
    </div>
  );

  let outraTexto = '';
  if (outra) {
    if (!outra.sorteio) outraTexto = `${outra.nome} ainda não fez o sorteio.`;
    else if (outra.sorteio.travessura === null) outraTexto = `${outra.nome} ainda está escolhendo a travessura.`;
    else outraTexto = `${outra.nome} vai pagar ${TRAVESSURAS[outra.sorteio.travessura].titulo}.`;
  }

  return (
    <div className="wrap">
      <header className="top">
        <img className="logo" src="/img/erural.png" alt="erural" />
        <a className="pill" href="/painel">Travessuras em aberto</a>
      </header>
      <main className="resultado">
        <div>
          <div className="evento-nome">{evento.nome}</div>
          <h1 className="h-creep">{decidido || opcoes.length === 1 ? 'Sua travessura' : 'Escolha sua travessura'}</h1>
        </div>

        {decidido ? (
          <Cartao t={TRAVESSURAS[sorteio.travessura]} pessoa={pessoa}>
            {blocoPrazo}
            <div className="acoes"><button className="btn" onClick={copiar}>Copiar para o grupo</button></div>
            <p className="nota" aria-live="polite">{nota}</p>
          </Cartao>
        ) : (
          <>
            <div className="opcoes">
              {opcoes.map((i) => (
                <Cartao key={i} t={TRAVESSURAS[i]} pessoa={pessoa}>
                  <div className="acoes"><button className="btn verde" disabled={salvando} onClick={() => escolher(i)}>Vou pagar essa</button></div>
                </Cartao>
              ))}
            </div>
            <div className="decidir">
              {opcoes.length === 1 ? (
                <>
                  <p>Não curtiu? Você pode sortear mais uma vez e depois escolher entre as duas.</p>
                  <div className="acoes"><button className="btn ghost" disabled={salvando} onClick={onDeNovo}>Sortear outra vez</button></div>
                </>
              ) : (
                <p>Você já usou a segunda chance. Agora é só escolher qual vai pagar.</p>
              )}
              {blocoPrazo}
              <p className="nota" aria-live="polite">{nota}</p>
            </div>
          </>
        )}

        {outra && (
          <div className="outra">
            <span className="pos">{outra.posicao ? `${outra.posicao}º` : ''}</span>
            {outraTexto}
          </div>
        )}
        <div className="centro"><button className="pill solid" onClick={onVoltar}>Voltar ao início</button></div>
      </main>
    </div>
  );
}
