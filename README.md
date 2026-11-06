# MedicinaHub — Sistema de Prontuário Clínico & Plataforma Médica

Plataforma moderna de apoio clínico, anamnese semiológica estruturada (Adulto & Pediátrico) e prescrição médica construída com **SvelteKit**, **Cloudflare Workers** e **Cloudflare D1**.

---

## 🔒 Princípio Inegociável de Privacidade (Client-Side First)

- **Soberania dos Dados de Saúde:** O banco de dados na nuvem (Cloudflare D1) armazena **exclusivamente dados cadastrais de conta e métricas de sessão de uso da plataforma**.
- **Nenhum Dado de Paciente é Salvo na Nuvem:** Todos os dados clínicos preenchidos nas anamneses (Adulto e Pediátrico) — tais como nome de paciente, idade, queixas, exames laboratoriais, hipóteses diagnósticas e prescrições — residem **estritamente na memória local do navegador** (`localStorage`).
- **Zero Tráfego de Dados Médicos:** Nenhum dado clínico é transmitido via requisições HTTP para o backend. Exportações em PDF e cópias no padrão SOAP são processadas 100% no cliente.

---

## 🛡️ Sistema de Cadastro & Limite por IP (Rate Limiting)

Para proteger o serviço contra automações e abusos na criação de contas:
1. **Identificação do IP:** O IP real do cliente é obtido através do cabeçalho `CF-Connecting-IP` da Cloudflare (com fallback para `x-forwarded-for` e `getClientAddress()` em desenvolvimento local).
2. **Limite Diário por IP:** Um mesmo endereço IP pode registrar no máximo **3 contas em uma janela de 24 horas**. Tentativas adicionais retornam HTTP 429 com mensagem de bloqueio amigável.
3. **Tabela `registration_attempts`:** Registra cada tentativa bem-sucedida (`ip_address`, `created_at`, `user_id`) com índice otimizado para consultas instantâneas.
4. **Campos do Cadastro:**
   - **Nome Completo:** identificação do profissional.
   - **E-mail:** normalizado em minúsculas e validado com regex de domínio.
   - **Instituição:** campo com autocomplete/sugestão pré-populada com `"UFSJ"` (Universidade Federal de São João del-Rei), aceitando qualquer instituição de ensino ou saúde.
   - **Senha:** criptografada de forma irreversível utilizando a Web Crypto API (`crypto.subtle`) com **Hash SHA-256 + Salt individual de 128 bits**.

---

## 📊 Sessões & Painel de Monitoramento Admin (`/admin/monitoramento`)

Área restrita e protegida por verificação de perfil (`role === 'admin'`) no backend:
- **Tabela `sessions`:** Registra `id`, `user_id`, `started_at`, `last_seen_at` e `ended_at`.
- **Heartbeat Periódico (`/api/session/heartbeat`):** Enquanto o usuário mantém a aba aberta e ativa, o navegador envia um ping a cada 60 segundos para atualizar o timestamp `last_seen_at`.
- **Cálculo do Tempo de Uso:** Calculado pela soma da duração em segundos de cada sessão `(COALESCE(ended_at, last_seen_at) - started_at)` e formatado amigavelmente (ex.: `3h 25min`, `45min`, `< 1min`).
- **Métricas Visíveis ao Administrador:**
  - Total de usuários cadastrados
  - Total de sessões realizadas
  - Tempo total de uso na plataforma
  - Tabela detalhada por usuário com filtro e busca rápida por nome, email e instituição
  - Exportação de relatório completo em CSV

---

## 📜 Política de Privacidade & LGPD (`/politica-de-privacidade`)

Página pública e acessível no rodapé de todas as telas do sistema, detalhando:
1. **Público-alvo:** Profissionais, médicos e estudantes da área da saúde.
2. **Dados de Conta:** Armazenamento exclusivo de dados cadastrais na Cloudflare.
3. **Isolamento de Prontuários:** Explicação da arquitetura local sem tráfego de dados confidenciais de terceiros.
4. **Não Compartilhamento:** Dados cadastrais não são vendidos ou cedidos a terceiros.
5. **Finalidade dos Cookies:** Exclusivamente técnicos para manutenção de sessão e rascunho temporário.
6. **Exclusão de Conta:** Instruções para solicitação de exclusão definitiva enviando e-mail para `valdotaincode@gmail.com` com o assunto `"Excluir conta"`.
7. **Conformidade LGPD:** Adesão aos princípios de segurança, prevenção e privacidade por padrão (Lei nº 13.709/2018).

---

## 🗄️ Schema do Banco de Dados (Cloudflare D1)

```sql
-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    institution TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'med',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabela de Tentativas de Cadastro (Rate Limit por IP)
CREATE TABLE IF NOT EXISTS registration_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    user_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_registration_ip_date ON registration_attempts(ip_address, created_at);

-- Tabela de Sessões e Métricas de Uso
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
```

---

## ✂️ Módulo de Anamnese Rápida — Pequenas Cirurgias Ambulatoriais (`/pequenas-cirurgias`)

Módulo orientado a schema (`src/lib/anamnese/`) projetado para preenchimento ágil no celular/desktop durante consultas de pequenas cirurgias ambulatoriais:

### Arquitetura do Módulo (`src/lib/anamnese/`)
- `schema.ts` — Definição declarativa das 6 seções e todos os campos (`yesno`, `radio`, `checkboxGroup`, `text`, `textarea`, `number`, `date`), regras de visibilidade (`showIf`), complementos condicionais (`conditionalDetail`) e alertas (`alert`).
- `types.ts` — Tipagem estrita TypeScript para o schema, respostas e estruturas serializadas.
- `state.svelte.ts` — Estado reativo com Svelte 5 Runes (`$state`, `$derived`), controle opt-in de rascunho em `localStorage` e atalho `"Marcar tudo como Não"` por seção.
- `serialize.ts` — Fonte única de verdade (`serializeAnswers(schema, answers, options)`) consumida tanto pelo gerador de PDF quanto pelo gerador de texto para área de transferência.
- `exportPdf.ts` — Geração 100% client-side de arquivo PDF A4 multipáginas (`anamnese_<nome-sem-acentos>_<AAAA-MM-DD>.pdf`) com suporte a acentuação em português (WinAnsiEncoding), bloco de Pontos de Atenção em destaque, paginação e campo de assinatura/carimbo.
- `exportText.ts` — Geração de texto puro estruturado e cópia com `navigator.clipboard.writeText` (e fallback `execCommand`).
- `serialize.test.ts` — Testes unitários cobrindo omissão de campos/seções vazias, inclusão de `"Não"`, filtro `onlyPositive`, omissão de campos ocultos por `showIf` e preservação de ordem.

### Como editar ou adicionar um campo no Schema
Basta adicionar ou editar um objeto em [`src/lib/anamnese/schema.ts`](src/lib/anamnese/schema.ts):
```ts
{
  id: 'meu_novo_campo',
  label: 'Usa medicação X?',
  type: 'yesno', // 'yesno' | 'radio' | 'checkboxGroup' | 'text' | 'textarea' | 'number' | 'date'
  allowNaoSei: true,
  alert: {
    triggerValue: 'Sim',
    label: 'Uso de medicação X',
    note: 'avaliar suspensão pré-operatória'
  },
  conditionalDetail: {
    triggerValue: 'Sim',
    placeholder: 'Dose e última tomada (opcional)'
  },
  showIf: {
    fieldId: 'sexo',
    equals: 'Feminino'
  }
}
```
A interface, o painel de "Pontos de Atenção", o texto copiado e o PDF passarão a refletir o novo campo automaticamente.

---

## 🚀 Desenvolvimento, Testes & Deploy no Cloudflare

```bash
# Instalar dependências
npm install

# Rodar localmente
npm run dev

# Executar testes unitários do serializador (serialize.ts)
npm test

# Verificação de tipos e linting (Svelte 5 + TypeScript)
npm run check

# Build de produção (@sveltejs/adapter-cloudflare)
npm run build

# Deploy para Cloudflare Workers / Pages
npm run deploy
```

