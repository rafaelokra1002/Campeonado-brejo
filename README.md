# ⚽ Campeonato Brejolandense de Futebol

Sistema completo para acompanhamento de um campeonato de futebol: tabela, jogos ao vivo (simulado via polling), times, elencos, artilharia e um painel administrativo com CRUD completo.

Inspirado em OneFootball e SofaScore: dark mode esportivo, mobile first, instalável como PWA.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TailwindCSS + React Router |
| Backend | Node.js + Express |
| Banco | SQLite (MVP) via Prisma ORM. Troca simples para PostgreSQL |
| Auth | JWT + bcrypt |
| Tempo real | Polling (10–20s) |
| PWA | manifest + service worker |

## Estrutura

```
campeonato-brejolandense/
├── backend/                 # API REST (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma    # modelos: Team, Player, Match, Goal, Card, User
│   │   └── seed.js          # dados de exemplo (12 times em 2 grupos, elencos, rodadas)
│   └── src/
│       ├── controllers/     # camada de requisição/validação
│       ├── services/        # regras (tabela, artilharia)
│       ├── routes/          # definição da API
│       ├── middleware/      # auth JWT + tratamento de erros
│       └── index.js         # bootstrap do Express
└── frontend/                # SPA React
    └── src/
        ├── pages/           # Home, Tabela, Jogos, Times, Artilharia, Admin...
        ├── components/      # UI + painel admin
        ├── context/         # AuthContext
        ├── hooks/           # usePolling (tempo real)
        └── api/             # cliente HTTP
```

## Como rodar (desenvolvimento)

Pré-requisito: Node.js 18+.

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env        # no Windows: copy .env.example .env
npm run setup               # cria o banco (prisma db push) + popula (seed)
npm run dev                 # http://localhost:4000
```

### 2) Frontend (em outro terminal)

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

O Vite faz proxy de `/api` para o backend automaticamente, sem precisar configurar URL em dev.

### Acesso admin (criado no seed)

```
E-mail: admin@brejolandense.com
Senha:  admin123
```

Acesse `/login` e depois `/admin` para gerenciar times, jogadores e jogos, e controlar o placar ao vivo.

## API REST (principais rotas)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|:----:|
| GET | `/api/dashboard` | dados da home | — |
| GET | `/api/standings` | classificação | — |
| GET | `/api/scorers` | artilharia | — |
| GET | `/api/teams` · `/api/teams/:id` | times | — |
| GET | `/api/matches?round=&status=&teamId=` | jogos filtrados | — |
| GET | `/api/matches/:id` | detalhes (gols/cartões) | — |
| POST | `/api/auth/login` | login | — |
| POST/PUT/DELETE | `/api/teams` · `/api/players` · `/api/matches` | CRUD | ✅ |
| PATCH | `/api/matches/:id/score` | placar/status ao vivo | ✅ |
| POST/DELETE | `/api/matches/:id/goals` · `/cards` | eventos | ✅ |

## Deploy

### Frontend no Vercel
- Root: `frontend/`
- Build: `npm run build`, output em `dist`
- Env: `VITE_API_URL=https://sua-api.onrender.com`
- `vercel.json` já configura o rewrite de SPA.

### Backend no Render (com PostgreSQL)
1. Em `backend/prisma/schema.prisma`, troque `provider = "sqlite"` por `provider = "postgresql"`.
2. Use o `render.yaml` (Blueprint), que cria o Postgres e injeta a `DATABASE_URL`.
3. Após o primeiro deploy, rode o seed uma vez: `npm run seed`.
4. Defina `CORS_ORIGIN` com a URL da Vercel.

## Funcionalidades

O dashboard da home reúne banner da rodada, jogos ao vivo, próximos jogos, últimos resultados, tabela resumida e artilharia num só lugar. A tabela de classificação traz P, J, V, E, D, GP, GC e SG com ordenação automática, forma recente e zonas de classificação/rebaixamento, separada por grupo.

A página de jogos permite filtrar por rodada e status, com placar ao vivo atualizado via polling; o detalhe de cada partida mostra a linha do tempo de gols e cartões, com opção de compartilhar no WhatsApp. Cada time tem página própria com escudo, elenco, estatísticas e jogos, e a artilharia traz o ranking de goleadores.

O painel admin cobre CRUD de times, jogadores e jogos, além de um controle dedicado para atualizar placar, gols e cartões em tempo real durante a partida. O site é instalável como PWA, tem SEO básico configurado e visual dark responsivo.
