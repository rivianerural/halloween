# Sorteio das Travessuras | erural

Site do sorteio da campanha Doçuras ou Travessuras. Cada pessoa da lanterna escolhe o evento, marca o próprio nome e sorteia a travessura. Se não gostar, pode sortear mais uma vez e escolher qual das duas vai pagar. O prazo de 24 horas conta a partir do primeiro sorteio.

- **Resultados automáticos:** o site lê a planilha de apuração a cada acesso. Preencheu o GMV realizado na aba Eventos, os nomes da lanterna já aparecem no site.
- **Segunda chance:** cada pessoa sorteia no máximo 2 vezes e escolhe uma das duas. As 2 pessoas de um mesmo evento nunca tiram a mesma travessura.
- **Painel (`/painel`):** mostra todas as travessuras sorteadas, com a contagem das 24h. Marcar como paga pede a senha definida em `ADMIN_PIN`.

## Passo a passo para publicar

### 1. Liberar a leitura da planilha
Hoje a planilha está compartilhada só com o domínio erural.net, e o site não consegue ler assim.
No Google Sheets: **Compartilhar → Acesso geral → Qualquer pessoa com o link → Leitor**.
Quem tiver o link consegue ver nomes e palpites. Se preferir manter a planilha fechada, veja "Planilha privada" no fim.

### 2. Supabase (já configurado)
A tabela `sorteios` já foi criada no projeto "rivianerural's Project" (`https://vhvygwwvflptyouqnnnl.supabase.co`), conforme `supabase/schema.sql`.
Falta só copiar a chave: em **Project Settings → API Keys**, copie a **service_role** (ou **secret key**). Essa chave é secreta: só vai na Vercel, nunca no código nem em mensagens.

### 3. GitHub
1. Abra o repositório `halloween` (ou crie, se ainda não existir).
2. Clique em **Add file → Upload files** (ou **uploading an existing file**, se o repositório estiver vazio).
3. Descompacte o zip, abra a pasta `travessuras` e arraste **tudo que está dentro dela** para a página. As pastas são mantidas.
4. Clique em **Commit changes**.

### 4. Vercel
1. Entre em vercel.com com a conta do GitHub e clique em **Add New → Project**.
2. Importe o repositório `halloween`.
3. Em **Environment Variables**, cadastre:
   - `SUPABASE_URL`: `https://vhvygwwvflptyouqnnnl.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: a chave service_role ou secret
   - `GOOGLE_SHEET_ID`: `13G74uQKP-gQyFReCVzn9QsBxFvyA46hJ447r9HqwP0A`
   - `ADMIN_PIN`: a senha para marcar travessuras como pagas
4. Clique em **Deploy**. Em cerca de 1 minuto o site fica no ar num link `.vercel.app`.

### 5. Testar
Abra o site, escolha o 3º Leilão Máxima Performance e confira se aparecem os 2 nomes da lanterna. Se aparecer um aviso de planilha inacessível, revise o passo 1.

## Como a planilha é lida
O site procura, em cada aba de evento, o GMV realizado em **B2**, a meta em **B3** e a tabela logo abaixo da linha com **Nome** na coluna A, em qualquer posição (A Nome, C Palpite, D Diferença, E Posição, F Resultado). Quem tem "Travessura" na coluna F entra no sorteio. Se mudar o nome de uma aba ou a posição dessas células, ajuste `lib/eventos.js` ou `lib/sheet.js`.

## Mudar as travessuras
A lista fica em `lib/travessuras.js`. Para incluir uma nova, adicione no **fim** da lista, porque o banco guarda a posição de cada travessura.

## Planilha privada (opcional)
1. No Google Cloud Console, crie um projeto, ative a **Google Sheets API** e crie uma **conta de serviço** com uma chave JSON.
2. Compartilhe a planilha com o e-mail da conta de serviço, como Leitor.
3. Na Vercel, crie a variável `GOOGLE_SERVICE_ACCOUNT_JSON` com o conteúdo do JSON, e faça um novo deploy.

## Rodar no computador
```
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev
```
