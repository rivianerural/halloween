'use client';

import { useEffect, useState } from 'react';
import { TRAVESSURAS } from '@/lib/travessuras';
import { prazoDe, contagem, dataHora, status, STATUS_LABEL } from '@/lib/tempo';

export default function PainelClient({ eventos }) {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('abertas');
  const [agora, setAgora] = useState(Date.now());
  const [aberta, setAberta] = useState(null);

  async function carregar() {
    try {
      const r = await fetch('/api/sorteios', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro);
      setLista(j.sorteios); setErro('');
    } catch (e) { setErro(e.message || 'Não consegui carregar as travessuras.'); }
  }

  useEffect(() => {
    carregar();
    const tick = setInterval(() => setAgora(Date.now()), 1000);
    const refresh = setInterval(carregar, 30000);
    return () => { clearInterval(tick); clearInterval(refresh); };
  }, []);

  async function pagar(s, desfazer = false, travessura) {
    let pin = sessionStorage.getItem('pin');
    if (!pin) { pin = window.prompt('Senha para marcar como paga:'); if (!pin) return; }
    const r = await fetch('/api/pagar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, pin, desfazer, travessura }) });
    const j = await r.json();
    if (!r.ok) { sessionStorage.removeItem('pin'); window.alert(j.erro || 'Não deu certo.'); return; }
    sessionStorage.setItem('pin', pin);
    setLista((l) => l.map((x) => (x.id === s.id ? j.sorteio : x)));
  }

  const nomeEvento = (slug) => eventos.find((e) => e.slug === slug)?.nome || slug;
  const todas = lista || [];
  const abertas = todas.filter((s) => !s.paga_em);
  const pagas = todas.filter((s) => s.paga_em);
  const mostrar = filtro === 'abertas' ? abertas : filtro === 'pagas' ? pagas : todas;

  return (
    <div className="painel-page">
      <div className="painel-head">
        <div className="wrap">
          <header className="top">
            <img className="logo" src="/img/erural.png" alt="erural" />
            <a className="pill solid" href="/">Sortear travessura</a>
          </header>
          <div className="painel-hero">
            <div>
              <h1 className="h-creep">Travessuras em aberto</h1>
              <p>Cada pessoa tem 24 horas, a partir do sorteio, para pagar a travessura.</p>
            </div>
            <img src="/img/maioralzinho.png" alt="" aria-hidden="true" />
          </div>
        </div>
      </div>

      <main className="wrap">
        <div className="tabs" aria-label="Filtrar travessuras">
          <button className="tab" aria-pressed={filtro === 'abertas'} onClick={() => setFiltro('abertas')}>Em aberto ({abertas.length})</button>
          <button className="tab" aria-pressed={filtro === 'pagas'} onClick={() => setFiltro('pagas')}>Pagas ({pagas.length})</button>
          <button className="tab" aria-pressed={filtro === 'todas'} onClick={() => setFiltro('todas')}>Todas ({todas.length})</button>
        </div>

        {erro && <p className="erro" style={{ marginTop: 20 }}>{erro}</p>}

        <div className="lista">
          {lista === null && !erro && <p className="vazio">Carregando...</p>}
          {lista !== null && mostrar.length === 0 && <p className="vazio">Nenhuma travessura aqui por enquanto.</p>}
          {mostrar.map((s) => {
            const st = status(s, agora);
            const prazo = prazoDe(s);
            const c = contagem(prazo.getTime() - agora);
            const indices = s.travessura !== null ? [s.travessura] : [s.opcao_1, s.opcao_2].filter((v) => v !== null);
            const titulo = indices.map((v) => TRAVESSURAS[v]?.titulo).join(' ou ');
            const verDetalhe = aberta === s.id;
            // Enquanto não escolhe, deixa claro em que ponto do sorteio a pessoa parou.
            const andamento = s.travessura !== null || st === 'paga' ? ''
              : s.opcao_2 === null ? 'Sorteou 1 de 2: já conta no prazo com essa, mas ainda pode sortear de novo uma vez.'
              : 'Sorteou 2 de 2: falta escolher qual das duas vai pagar. O prazo já está correndo.';
            // Com duas opções e sem escolha, quem marca como paga precisa dizer qual foi.
            const escolherAoPagar = s.travessura === null && indices.length > 1;
            return (
              <div className="linha" key={s.id}>
                <div className="who"><b>{s.pessoa}</b><span>{nomeEvento(s.evento)}</span></div>
                <div className="t">
                  <button className="t-btn" aria-expanded={verDetalhe} aria-controls={`detalhe-${s.id}`} onClick={() => setAberta(verDetalhe ? null : s.id)}>
                    {titulo}
                    <span className="t-ver">{verDetalhe ? 'Esconder descrição' : 'Ver descrição'}</span>
                  </button>
                  {andamento && <small className="andamento">{andamento}</small>}
                </div>
                <div className="st">
                  <span className={`badge ${st}`}>{STATUS_LABEL[st]}</span>
                  <span className="tempo">
                    {st === 'paga' ? `em ${dataHora(new Date(s.paga_em))}` : c.neg ? `há ${c.texto}` : c.texto}
                  </span>
                </div>
                {st === 'paga'
                  ? <button className="acao" onClick={() => pagar(s, true)}>Desfazer</button>
                  : escolherAoPagar ? <button className="acao" onClick={() => setAberta(s.id)}>Marcar como paga</button>
                  : <button className="acao" onClick={() => pagar(s)}>Marcar como paga</button>}
                {verDetalhe && (
                  <div className="detalhe" id={`detalhe-${s.id}`}>
                    {indices.map((v) => TRAVESSURAS[v] && (
                      <div key={v} className="detalhe-item">
                        {indices.length > 1 && <b>{TRAVESSURAS[v].titulo}</b>}
                        <div className="modo"><small>No escritório</small><p>{TRAVESSURAS[v].escritorio}</p></div>
                        <div className="modo"><small>De casa</small><p>{TRAVESSURAS[v].casa}</p></div>
                        {escolherAoPagar && st !== 'paga' && <button className="acao" onClick={() => pagar(s, false, v)}>Pagou esta</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
