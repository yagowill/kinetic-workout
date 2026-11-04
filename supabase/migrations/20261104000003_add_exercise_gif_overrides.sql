-- Migration: GIFs personalizados por exercício.
-- Cada personal pode substituir o GIF de um exercício da biblioteca externa.
-- O override vale para todos os treinos e alunos do personal.
-- O GIF original em workout_items.gif_url continua como fallback.

-- ---------------------------------------------------------------------------
-- 1. Tabela de overrides
-- ---------------------------------------------------------------------------

create table public.exercise_gif_overrides (
  id uuid primary key default gen_random_uuid(),
  personal_id uuid not null references auth.users (id) on delete cascade,
  external_exercise_id varchar(50) not null,
  exercise_name varchar(150) not null,
  gif_url text not null,
  storage_path text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint exercise_gif_overrides_exercise_id_not_blank
    check (length(trim(external_exercise_id)) > 0),
  constraint exercise_gif_overrides_exercise_name_not_blank
    check (length(trim(exercise_name)) > 0),
  constraint exercise_gif_overrides_gif_url_not_blank
    check (length(trim(gif_url)) > 0),
  constraint exercise_gif_overrides_personal_exercise_unique
    unique (personal_id, external_exercise_id)
);

create trigger exercise_gif_overrides_set_updated_at
before update on public.exercise_gif_overrides
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.exercise_gif_overrides enable row level security;

-- Cada personal gerencia apenas os próprios overrides.
create policy "Personal trainers manage their own exercise gif overrides"
on public.exercise_gif_overrides
for all
to authenticated
using (personal_id = (select auth.uid()))
with check (personal_id = (select auth.uid()));

grant select, insert, update, delete
on public.exercise_gif_overrides
to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Storage dos GIFs enviados
-- ---------------------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'exercise-gifs',
  'exercise-gifs',
  true,
  8388608,
  array['image/gif', 'image/webp', 'image/png', 'image/jpeg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Leitura pública: os GIFs não são dados sensíveis.
create policy "Exercise gifs are publicly readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'exercise-gifs');

-- Upload, atualização e remoção restritos à pasta do próprio usuário.
create policy "Authenticated users can upload their own exercise gifs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'exercise-gifs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Authenticated users can update their own exercise gifs"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'exercise-gifs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'exercise-gifs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Authenticated users can delete their own exercise gifs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'exercise-gifs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- ---------------------------------------------------------------------------
-- 4. Leitura pública do plano com GIFs personalizados
-- ---------------------------------------------------------------------------

-- Retorna o plano e seus itens sem expor o access_token.
-- O GIF do override do personal dono do aluno substitui o GIF original.
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
    'student_name', s.name,
    'items', coalesce(
      (
        select jsonb_agg(
          (
            to_jsonb(wi) || jsonb_build_object(
              'gif_url',
              coalesce(ego.gif_url, wi.gif_url)
            )
          )
          order by wi.session_label, wi.order_index
        )
        from public.workout_items wi
        left join public.exercise_gif_overrides ego
          on ego.personal_id = s.personal_id
         and ego.external_exercise_id = wi.external_exercise_id
        where wi.workout_plan_id = wp.id
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from public.workout_plans wp
  join public.students s on s.id = wp.student_id
  where wp.access_token = p_access_token
    and wp.is_active = true;

  return v_result;
end;
$$;

revoke all on function public.get_public_workout_plan(text) from public;
grant execute on function public.get_public_workout_plan(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Documentação dos objetos
-- ---------------------------------------------------------------------------

comment on table public.exercise_gif_overrides
  is 'GIFs personalizados por personal trainer para exercícios da biblioteca externa.';
comment on column public.exercise_gif_overrides.external_exercise_id
  is 'Identificador do exercício na API ExerciseGymGifsDB.';
comment on column public.exercise_gif_overrides.storage_path
  is 'Caminho do arquivo no bucket exercise-gifs, quando o GIF foi enviado pelo app.';
comment on function public.get_public_workout_plan(text)
  is 'Retorna o plano público pelo token, aplicando os GIFs personalizados do personal.';
