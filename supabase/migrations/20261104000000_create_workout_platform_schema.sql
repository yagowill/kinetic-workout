-- Migration: modelagem inicial da plataforma de montagem de treinos.
-- Cria as tabelas, índices, funções auxiliares, políticas de RLS e RPCs
-- necessárias para personal trainers e acesso público do aluno por token.

-- Necessário para a geração criptograficamente segura dos access tokens.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Tabelas
-- ---------------------------------------------------------------------------

-- Alunos vinculados ao personal trainer autenticado.
create table public.students (
  id uuid primary key default gen_random_uuid(),
  personal_id uuid not null references auth.users (id) on delete cascade,
  name varchar(100) not null,
  phone varchar(20) not null,
  created_at timestamp with time zone not null default now(),
  constraint students_name_not_blank check (length(trim(name)) > 0),
  constraint students_phone_not_blank check (length(trim(phone)) > 0)
);

-- Anamnese do aluno. A restrição UNIQUE garante o relacionamento 1:1.
create table public.student_anamneses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students (id) on delete cascade,
  primary_goal varchar(100) not null,
  experience_level varchar(50) not null,
  joint_pains jsonb not null default '[]'::jsonb,
  medical_conditions jsonb not null default '[]'::jsonb,
  weekly_frequency integer not null default 3,
  additional_notes text null,
  updated_at timestamp with time zone not null default now(),
  constraint student_anamneses_primary_goal_not_blank check (length(trim(primary_goal)) > 0),
  constraint student_anamneses_experience_level_not_blank check (length(trim(experience_level)) > 0),
  constraint student_anamneses_joint_pains_is_array check (jsonb_typeof(joint_pains) = 'array'),
  constraint student_anamneses_medical_conditions_is_array check (jsonb_typeof(medical_conditions) = 'array'),
  constraint student_anamneses_weekly_frequency_range check (weekly_frequency between 1 and 14)
);

-- Planos de treino. O access_token é o segredo usado pelo aluno no PWA.
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  title varchar(100) not null,
  access_token varchar(64) not null unique default encode(gen_random_bytes(32), 'hex'),
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint workout_plans_title_not_blank check (length(trim(title)) > 0),
  constraint workout_plans_access_token_length check (length(access_token) between 32 and 64)
);

-- Exercícios que compõem cada sessão do plano de treino.
create table public.workout_items (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans (id) on delete cascade,
  session_label varchar(10) not null,
  external_exercise_id varchar(50) not null,
  exercise_name varchar(150) not null,
  gif_url text not null,
  target_muscle varchar(50) not null,
  sets integer not null default 3,
  reps varchar(20) not null default '10-12',
  rest_seconds integer not null default 60,
  notes text null,
  order_index integer not null default 1,
  constraint workout_items_session_label_not_blank check (length(trim(session_label)) > 0),
  constraint workout_items_external_exercise_id_not_blank check (length(trim(external_exercise_id)) > 0),
  constraint workout_items_exercise_name_not_blank check (length(trim(exercise_name)) > 0),
  constraint workout_items_gif_url_not_blank check (length(trim(gif_url)) > 0),
  constraint workout_items_target_muscle_not_blank check (length(trim(target_muscle)) > 0),
  constraint workout_items_sets_positive check (sets > 0),
  constraint workout_items_reps_not_blank check (length(trim(reps)) > 0),
  constraint workout_items_rest_seconds_non_negative check (rest_seconds >= 0),
  constraint workout_items_order_index_positive check (order_index > 0)
);

-- ---------------------------------------------------------------------------
-- 2. Índices de apoio às consultas e às políticas de RLS
-- ---------------------------------------------------------------------------

create index students_personal_id_idx
  on public.students (personal_id);

create index workout_plans_student_id_idx
  on public.workout_plans (student_id);

create index workout_items_workout_plan_id_idx
  on public.workout_items (workout_plan_id);

create index workout_items_plan_session_order_idx
  on public.workout_items (workout_plan_id, session_label, order_index);

-- ---------------------------------------------------------------------------
-- 3. Funções auxiliares
-- ---------------------------------------------------------------------------

-- Atualiza automaticamente o campo updated_at antes de cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger student_anamneses_set_updated_at
before update on public.student_anamneses
for each row
execute function public.set_updated_at();

-- Lê o token de acesso enviado pelo cliente público.
-- O token pode vir no header "x-workout-access-token" (PostgREST) ou na
-- configuração local "app.workout_access_token" (testes e rotinas internas).
create or replace function public.current_workout_access_token()
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_headers jsonb := '{}'::jsonb;
  v_header_token text;
begin
  begin
    v_headers := coalesce(
      nullif(current_setting('request.headers', true), ''),
      '{}'
    )::jsonb;
  exception
    when others then
      v_headers := '{}'::jsonb;
  end;

  v_header_token := nullif(v_headers ->> 'x-workout-access-token', '');

  return coalesce(
    v_header_token,
    nullif(current_setting('app.workout_access_token', true), '')
  );
end;
$$;

-- Verifica, sem depender das políticas de RLS, se o plano é público e se o
-- token informado na requisição corresponde ao token armazenado.
create or replace function public.is_public_workout_plan(p_workout_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workout_plans wp
    where wp.id = p_workout_plan_id
      and wp.is_active = true
      and wp.access_token = public.current_workout_access_token()
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.students enable row level security;
alter table public.student_anamneses enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_items enable row level security;

-- Personal trainer pode realizar CRUD apenas nos próprios alunos.
create policy "Personal trainers manage their own students"
on public.students
for all
to authenticated
using (personal_id = (select auth.uid()))
with check (personal_id = (select auth.uid()));

-- Personal trainer pode realizar CRUD apenas nas anamneses dos próprios alunos.
create policy "Personal trainers manage anamneses of their own students"
on public.student_anamneses
for all
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_anamneses.student_id
      and s.personal_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.students s
    where s.id = student_anamneses.student_id
      and s.personal_id = (select auth.uid())
  )
);

-- Personal trainer pode realizar CRUD apenas nos planos dos próprios alunos.
create policy "Personal trainers manage workout plans of their own students"
on public.workout_plans
for all
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = workout_plans.student_id
      and s.personal_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.students s
    where s.id = workout_plans.student_id
      and s.personal_id = (select auth.uid())
  )
);

-- Personal trainer pode realizar CRUD apenas nos itens dos próprios planos.
create policy "Personal trainers manage workout items of their own plans"
on public.workout_items
for all
to authenticated
using (
  exists (
    select 1
    from public.workout_plans wp
    join public.students s on s.id = wp.student_id
    where wp.id = workout_items.workout_plan_id
      and s.personal_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workout_plans wp
    join public.students s on s.id = wp.student_id
    where wp.id = workout_items.workout_plan_id
      and s.personal_id = (select auth.uid())
  )
);

-- Leitura pública do plano somente quando o header contém o token exato.
-- Sem token válido, a política não retorna nenhuma linha.
create policy "Public can read workout plans with a valid access token"
on public.workout_plans
for select
to anon, authenticated
using (
  is_active = true
  and access_token = public.current_workout_access_token()
);

-- Leitura pública dos itens somente quando o plano pai possui token válido.
create policy "Public can read workout items with a valid access token"
on public.workout_items
for select
to anon, authenticated
using (public.is_public_workout_plan(workout_plan_id));

-- ---------------------------------------------------------------------------
-- 5. Permissões de tabela e de execução
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.student_anamneses to authenticated;
grant select, insert, update, delete on public.workout_plans to authenticated;
grant select, insert, update, delete on public.workout_items to authenticated;
grant select on public.workout_plans to anon;
grant select on public.workout_items to anon;

revoke all on function public.current_workout_access_token() from public;
grant execute on function public.current_workout_access_token() to anon, authenticated;

revoke all on function public.is_public_workout_plan(uuid) from public;
grant execute on function public.is_public_workout_plan(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. RPC de duplicação atômica de plano de treino
-- ---------------------------------------------------------------------------

-- Duplica o plano e todos os seus itens em uma única transação.
-- A função roda como SECURITY INVOKER para que as políticas de RLS continuem
-- validando o personal autenticado.
create or replace function public.duplicate_workout_plan(
  p_original_plan_id uuid,
  p_target_student_id uuid,
  p_new_title text,
  p_new_access_token text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_personal_id uuid := auth.uid();
  v_new_plan_id uuid;
  v_access_token text;
begin
  if v_personal_id is null then
    raise exception 'Usuário não autenticado.'
      using errcode = '42501';
  end if;

  if p_new_title is null
    or length(trim(p_new_title)) = 0
    or length(trim(p_new_title)) > 100 then
    raise exception 'O título do plano deve ter entre 1 e 100 caracteres.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.students s
    where s.id = p_target_student_id
      and s.personal_id = v_personal_id
  ) then
    raise exception 'Aluno de destino não encontrado ou sem permissão.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.workout_plans wp
    join public.students s on s.id = wp.student_id
    where wp.id = p_original_plan_id
      and s.personal_id = v_personal_id
  ) then
    raise exception 'Plano original não encontrado ou sem permissão.'
      using errcode = '42501';
  end if;

  v_access_token := coalesce(
    nullif(trim(p_new_access_token), ''),
    encode(gen_random_bytes(32), 'hex')
  );

  if length(v_access_token) < 32 or length(v_access_token) > 64 then
    raise exception 'O access token deve ter entre 32 e 64 caracteres.'
      using errcode = '22023';
  end if;

  insert into public.workout_plans (student_id, title, access_token, is_active)
  values (p_target_student_id, trim(p_new_title), v_access_token, true)
  returning id into v_new_plan_id;

  insert into public.workout_items (
    workout_plan_id,
    session_label,
    external_exercise_id,
    exercise_name,
    gif_url,
    target_muscle,
    sets,
    reps,
    rest_seconds,
    notes,
    order_index
  )
  select
    v_new_plan_id,
    wi.session_label,
    wi.external_exercise_id,
    wi.exercise_name,
    wi.gif_url,
    wi.target_muscle,
    wi.sets,
    wi.reps,
    wi.rest_seconds,
    wi.notes,
    wi.order_index
  from public.workout_items wi
  where wi.workout_plan_id = p_original_plan_id
  order by wi.session_label, wi.order_index;

  return v_new_plan_id;
end;
$$;

revoke all on function public.duplicate_workout_plan(uuid, uuid, text, text) from public;
grant execute on function public.duplicate_workout_plan(uuid, uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. RPC de leitura pública do plano pelo token
-- ---------------------------------------------------------------------------

-- Retorna o plano e seus itens sem expor o access_token.
-- SECURITY DEFINER é seguro aqui porque a única chave de busca é o token.
create or replace function public.get_public_workout_plan(p_access_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if p_access_token is null or length(trim(p_access_token)) = 0 then
    return null;
  end if;

  select jsonb_build_object(
    'plan', to_jsonb(wp) - 'access_token',
    'items', coalesce(
      (
        select jsonb_agg(to_jsonb(wi) order by wi.session_label, wi.order_index)
        from public.workout_items wi
        where wi.workout_plan_id = wp.id
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from public.workout_plans wp
  where wp.access_token = p_access_token
    and wp.is_active = true;

  return v_result;
end;
$$;

revoke all on function public.get_public_workout_plan(text) from public;
grant execute on function public.get_public_workout_plan(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Documentação dos objetos
-- ---------------------------------------------------------------------------

comment on table public.students is 'Alunos cadastrados por cada personal trainer.';
comment on column public.students.personal_id is 'Personal trainer proprietário do aluno.';

comment on table public.student_anamneses is 'Anamnese inicial e informações de saúde do aluno.';
comment on column public.student_anamneses.joint_pains is 'Lista JSON de dores articulares relatadas pelo aluno.';
comment on column public.student_anamneses.medical_conditions is 'Lista JSON de condições médicas relatadas pelo aluno.';

comment on table public.workout_plans is 'Planos de treino criados para os alunos.';
comment on column public.workout_plans.access_token is 'Token secreto usado pelo aluno para acessar o plano no PWA.';

comment on table public.workout_items is 'Exercícios que compõem as sessões de um plano de treino.';

comment on function public.duplicate_workout_plan(uuid, uuid, text, text)
  is 'Duplica um plano de treino e seus itens de forma atômica.';
comment on function public.get_public_workout_plan(text)
  is 'Retorna o plano e os itens a partir de um access token válido.';
