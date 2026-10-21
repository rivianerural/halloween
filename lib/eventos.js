// Cada evento aponta para a aba da planilha de apuração com o mesmo nome.
export const EVENTOS = [
  { slug: 'maxima-performance', nome: '3º Leilão Máxima Performance Nelore Sant’anna', data: '20/10', aba: '1 Máxima Performance', apuracao: '21/10, às 16h' },
  { slug: 'potencia-genetica', nome: '2º Leilão Potência Genética | Faz. Limeira', data: '21/10', aba: '2 Potência Genética', apuracao: '22/10, às 16h' },
  { slug: 'alianca-topo', nome: '2º Leilão Aliança Topo da Genética', data: '22/10', aba: '3 Aliança Topo', apuracao: '23/10, às 16h' },
  { slug: 'marcondes-touros', nome: 'Leilão Nelore Marcondes | Touros | Etapa Primavera', data: '24/10', aba: '4 Marcondes Touros', apuracao: '25/10, às 16h' },
  { slug: 'futuro-de-confianca', nome: 'Leilão Futuro de Confiança', data: '27/10', aba: '5 Futuro de Confiança', apuracao: '28/10, às 16h' },
  { slug: 'genetica-aditiva', nome: 'Leilão Genética Aditiva e 7P Agro', data: '30/10', aba: '6 Genética Aditiva', apuracao: '31/10, às 16h' },
  { slug: 'shop-femeas-sindi', nome: '3º Shopping Fêmeas Sindi | Agro FTI', data: 'até 31/10', aba: '7 Shop Fêmeas Sindi', apuracao: 'GMV até 31/10' },
  { slug: 'shop-maxima-performance', nome: '3º Shopping Máxima Performance Nelore Santanna', data: 'até 31/10', aba: '8 Shop Máxima Perf', apuracao: 'GMV até 31/10' },
  { slug: 'shop-nelore-fti', nome: '3º Shopping Nelore | Agro FTI', data: 'até 31/10', aba: '9 Shop Nelore FTI', apuracao: 'GMV até 31/10' },
];

export const getEvento = (slug) => EVENTOS.find((e) => e.slug === slug);
