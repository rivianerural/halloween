-- Rode no Supabase: SQL Editor > New query > cole tudo > Run
-- Cada pessoa sorteia até 2 travessuras (opcao_1 e opcao_2) e escolhe qual vai pagar (travessura).
create table if not exists public.sorteios (
  id uuid primary key default gen_random_uuid(),
  evento text not null,
  pessoa text not null,
  opcao_1 int not null,
  opcao_2 int,
  travessura int,
  sorteado_em timestamptz not null default now(),
  escolhida_em timestamptz,
  paga_em timestamptz,
  constraint uma_por_pessoa unique (evento, pessoa),
  constraint sem_repetir_no_evento unique (evento, travessura)
);

-- Ninguém acessa a tabela direto pelo navegador.
-- Só o servidor do site (com a service role key) lê e grava.
alter table public.sorteios enable row level security;
