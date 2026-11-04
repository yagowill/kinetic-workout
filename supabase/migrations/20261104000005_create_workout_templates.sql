-- Modelos de treino pertencem ao personal e guardam uma cópia dos exercícios.
create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  personal_id uuid not null references auth.users (id) on delete cascade,
  title varchar(100) not null,
  created_at timestamp with time zone not null default now(),
  constraint workout_templates_title_not_blank check (length(trim(title)) > 0)
);

create table public.workout_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates (id) on delete cascade,
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
  constraint workout_template_items_session_label_not_blank check (length(trim(session_label)) > 0),
  constraint workout_template_items_exercise_name_not_blank check (length(trim(exercise_name)) > 0),
  constraint workout_template_items_sets_positive check (sets > 0),
  constraint workout_template_items_rest_seconds_non_negative check (rest_seconds >= 0),
  constraint workout_template_items_order_index_positive check (order_index > 0)
);

create index workout_templates_personal_id_idx
  on public.workout_templates (personal_id, created_at desc);

create index workout_template_items_template_session_order_idx
  on public.workout_template_items (template_id, session_label, order_index);

alter table public.workout_templates enable row level security;
alter table public.workout_template_items enable row level security;

create policy "Personal trainers manage their own workout templates"
on public.workout_templates
for all
to authenticated
using (personal_id = (select auth.uid()))
with check (personal_id = (select auth.uid()));

create policy "Personal trainers manage items of their own workout templates"
on public.workout_template_items
for all
to authenticated
using (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_items.template_id
      and wt.personal_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_items.template_id
      and wt.personal_id = (select auth.uid())
  )
);

grant select, insert, update, delete on public.workout_templates to authenticated;
grant select, insert, update, delete on public.workout_template_items to authenticated;

create or replace function public.save_workout_template(
  p_source_plan_id uuid,
  p_title text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_personal_id uuid := auth.uid();
  v_template_id uuid;
begin
  if v_personal_id is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  if p_title is null or length(trim(p_title)) = 0 or length(trim(p_title)) > 100 then
    raise exception 'O nome do modelo deve ter entre 1 e 100 caracteres.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.workout_plans wp
    join public.students s on s.id = wp.student_id
    where wp.id = p_source_plan_id
      and s.personal_id = v_personal_id
  ) then
    raise exception 'Plano de origem não encontrado ou sem permissão.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.workout_items wi
    where wi.workout_plan_id = p_source_plan_id
  ) then
    raise exception 'Adicione exercícios ao treino antes de salvá-lo como modelo.' using errcode = '22023';
  end if;

  insert into public.workout_templates (personal_id, title)
  values (v_personal_id, trim(p_title))
  returning id into v_template_id;

  insert into public.workout_template_items (
    template_id,
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
    v_template_id,
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
  where wi.workout_plan_id = p_source_plan_id
  order by wi.session_label, wi.order_index;

  return v_template_id;
end;
$$;

create or replace function public.apply_workout_template(
  p_template_id uuid,
  p_target_plan_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_personal_id uuid := auth.uid();
begin
  if v_personal_id is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.workout_templates wt
    where wt.id = p_template_id
      and wt.personal_id = v_personal_id
  ) then
    raise exception 'Modelo não encontrado ou sem permissão.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.workout_plans wp
    join public.students s on s.id = wp.student_id
    where wp.id = p_target_plan_id
      and s.personal_id = v_personal_id
  ) then
    raise exception 'Plano de destino não encontrado ou sem permissão.' using errcode = '42501';
  end if;

  delete from public.workout_items
  where workout_plan_id = p_target_plan_id;

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
    p_target_plan_id,
    wti.session_label,
    wti.external_exercise_id,
    wti.exercise_name,
    wti.gif_url,
    wti.target_muscle,
    wti.sets,
    wti.reps,
    wti.rest_seconds,
    wti.notes,
    wti.order_index
  from public.workout_template_items wti
  where wti.template_id = p_template_id
  order by wti.session_label, wti.order_index;

  update public.workout_plans
  set title = (
    select wt.title
    from public.workout_templates wt
    where wt.id = p_template_id
  )
  where id = p_target_plan_id;

  return true;
end;
$$;

revoke all on function public.save_workout_template(uuid, text) from public;
revoke all on function public.apply_workout_template(uuid, uuid) from public;
grant execute on function public.save_workout_template(uuid, text) to authenticated;
grant execute on function public.apply_workout_template(uuid, uuid) to authenticated;