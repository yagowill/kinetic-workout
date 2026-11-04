# Kinetic Workout

Plataforma **mobile-first** para personal trainers de baixa habilidade tecnológica montarem, adaptarem e compartilharem treinos com alunos pelo WhatsApp.

O projeto combina um painel simples para o personal, uma anamnese guiada por toques e uma PWA em modo escuro para o aluno acompanhar o treino do dia.

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)](https://nuxt.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

## Sobre

O Kinetic foi desenhado para reduzir digitação e decisões complexas:

- Botões e áreas de toque com no mínimo **48px**.
- Navegação por cards, chips e abas.
- Alertas clínicos visíveis durante a montagem do treino.
- Link público e seguro para o aluno abrir o treino no celular.

> **Status:** funcional com dados reais. O personal trainer autentica com e-mail e senha, e as telas leem e gravam alunos, anamneses e treinos no Supabase.

## Funcionalidades

- **Dashboard do personal:** carteira de alunos, status da anamnese, alertas de dor e cadastro de novo aluno.
- **Cadastro sem anamnese manual:** o personal cadastra nome e WhatsApp, e envia ao aluno o link individual para responder.
- **Anamnese em 3 passos:** objetivo, rotina e saúde, com seleção múltipla de dores e condições médicas.
- **Anamnese pelo aluno:** link no WhatsApp, formulário público em tema claro e respostas que podem ser atualizadas depois.
- **Criador de treino:** banner fixo de lesão, divisões (Treino A, B, C…), busca de exercícios por grupo muscular, preview em GIF e ajuste de séries sem digitar.
- **Modelos reutilizáveis:** salve um treino completo como modelo e aplique em outros alunos, mantendo o link de treino de cada um.
- **PWA do aluno:** modo escuro, progresso do treino, cards com GIF e checkbox gigante de conclusão.
- **GIFs personalizados:** troca do GIF de um exercício por upload ou URL, valendo para todos os treinos do personal.
- **Compartilhamento:** geração de link `wa.me` com mensagem pronta e token público do plano.

## Stack

- [Nuxt 4](https://nuxt.com) + Vue 3 + TypeScript
- [Tailwind CSS 3](https://tailwindcss.com) com tokens próprios
- [Supabase](https://supabase.com) (Postgres, RLS e RPC transacional)
- [ExerciseGymGifsDB](https://github.com/JahelCuadrado/ExerciseGymGifsDB) para os GIFs dos exercícios

## Telas e rotas

| Rota | Acesso | Descrição |
| --- | --- | --- |
| `/login` | Público | Entrada e criação de conta do personal |
| `/` | Autenticado | Dashboard do personal |
| `/anamnesis/new` | Autenticado | Cadastro de aluno + anamnese |
| `/anamnesis/[studentId]` | Autenticado | Anamnese de um aluno existente |
| `/workout/[studentId]` | Autenticado | Criador de treino |
| `/t/[accessToken]` | Público | PWA do aluno (modo escuro) |
| `/a/[anamnesisToken]` | Público | Anamnese preenchida pelo aluno |

O acesso do aluno usa tokens gerados pelo banco. Não há login para o aluno: o link enviado pelo WhatsApp é a credencial. O token do treino (`/t/...`) e o token da anamnese (`/a/...`) são independentes.

## Autenticação e dados reais

O middleware global `app/middleware/auth.global.ts` protege as rotas do personal e libera apenas `/login` e `/t/*`.

- Crie a conta em `/login` com e-mail e senha.
- Se a confirmação de e-mail estiver ativa no Supabase, confirme o cadastro antes de entrar.
- Cada aluno é vinculado ao `personal_id` do usuário autenticado.
- As políticas de RLS garantem que cada personal veja somente a própria carteira.
- Alunos, anamneses e treinos são lidos e gravados pelos services em `app/services/`.

Para popular a aplicação, basta cadastrar alunos pela própria interface. Não há mais dados mockados no código.

## Anamnese pelo aluno

O personal pode enviar a anamnese pelo WhatsApp de duas formas:

- no card do aluno, em **Pedir anamnese no WhatsApp** (ou **Enviar anamnese** quando já respondida);
- na tela de anamnese, pelo ícone do WhatsApp no topo ou pelo botão após salvar.

O aluno abre o link público `/a/<token>`, responde em 3 passos e envia. O mesmo link continua válido para atualizar as respostas. O personal vê e edita a mesma anamnese na área autenticada.

- O token fica em `students.anamnesis_token` e é independente do token do treino.
- As respostas são gravadas em `student_anamneses` pelas RPCs `get_public_anamnesis` e `save_public_anamnesis`.
- A página pública é clara, mobile-first e não exige login.

## Design System

Os tokens ficam em `tailwind.config.ts` e os estilos reutilizáveis em `app/assets/css/main.css`.

- Neutros em **slate**.
- Primária em **indigo** (`brand`).
- Sucesso em **verde** (`success`), usado em WhatsApp e conclusão.
- Alertas em **âmbar** (`warning`) e **vermelho** (`danger`).
- Tipografia sans-serif com títulos em negrito.
- Classes utilitárias: `.btn`, `.card`, `.chip`, `.badge`, `.input`, `.pb-safe`.

A especificação completa está em [`DESIGN.md`](./DESIGN.md).

## Como rodar

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

### Scripts

```bash
npm run dev        # ambiente de desenvolvimento
npm run build      # build de produção
npm run preview    # prévia do build
npm run generate   # geração estática
npx nuxi typecheck # verificação de tipos
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
NUXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=sua-chave-anon
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

Sem credenciais, o projeto usa um fallback de prévia visual definido em `nuxt.config.ts`. **Não use esse fallback em produção.**

## Banco de dados

A migration inicial está em:

```text
supabase/migrations/20261104000000_create_workout_platform_schema.sql
```

Ela cria as tabelas, políticas de RLS, leitura pública por token e a RPC transacional `duplicate_workout_plan`.

A migration complementar está em:

```text
supabase/migrations/20261104000001_add_student_name_to_public_workout_plan.sql
```

Ela adiciona o nome do aluno ao retorno público da RPC `get_public_workout_plan`, usado pela PWA.

A migration de GIFs personalizados está em:

```text
supabase/migrations/20261104000003_add_exercise_gif_overrides.sql
```

Ela cria a tabela `exercise_gif_overrides`, as políticas de RLS, o bucket público `exercise-gifs` (limite de 8 MB) e atualiza a RPC `get_public_workout_plan` para aplicar os GIFs do personal dono do aluno.

A migration da anamnese pública está em:

```text
supabase/migrations/20261104000004_add_public_anamnesis.sql
```

Ela adiciona `students.anamnesis_token` e as RPCs `get_public_anamnesis` e `save_public_anamnesis`, usadas pelo formulário público do aluno.

A migration dos modelos de treino está em:

```text
supabase/migrations/20261104000005_create_workout_templates.sql
```

Ela cria modelos isolados por personal e as RPCs para salvar um treino como modelo ou copiá-lo para um aluno.

Aplique as migrations com a CLI do Supabase:

```bash
supabase link --project-ref <seu-project-ref>
supabase db push
```

## Estrutura do projeto

```text
app/
  actions/       # regras de negócio de treino
  components/    # componentes reutilizáveis
  middleware/    # proteção de rotas do personal
  pages/         # login, dashboard, anamnese, treino e PWA
  services/      # Supabase, exercícios e WhatsApp
  types/         # tipos do banco e da interface
  utils/         # tradução de grupos musculares
supabase/
  migrations/    # schema, RLS e RPC
tailwind.config.ts
nuxt.config.ts
DESIGN.md
```

## Exercícios

Os GIFs vêm do repositório `ExerciseGymGifsDB`, fixados na versão `v1.1.0` via jsDelivr. O serviço em `app/services/exerciseService.ts` consome `api/<lang>/exercises.json` e permite busca e filtro por grupo muscular.

### GIFs personalizados

Quando um GIF da biblioteca deixa de funcionar, o personal pode substituí-lo sem alterar o exercício:

- O botão **Trocar GIF** fica no card do treino e no seletor de exercícios.
- Se a imagem falhar, o card mostra o aviso **GIF indisponível** e o botão vira **Corrigir GIF**.
- É possível enviar um arquivo (GIF, WebP, PNG ou JPG, até 8 MB) ou colar uma URL `https`.
- A troca é por exercício e vale para todos os treinos e alunos do personal.
- **Restaurar GIF original** remove a personalização e volta ao GIF da biblioteca.

Os overrides ficam em `exercise_gif_overrides`, com o arquivo enviado no bucket `exercise-gifs`. O GIF original continua salvo em `workout_items.gif_url` como fallback. A PWA pública aplica os overrides pela RPC, então o aluno vê a correção automaticamente.

## Próximos passos

- Persistir a conclusão dos exercícios na PWA.
- Criar testes de fluxo para anamnese e montagem de treino.
- Permitir editar reps e descanso dos exercícios no criador de treino.

## Licença

Projeto privado. Todos os direitos reservados.
