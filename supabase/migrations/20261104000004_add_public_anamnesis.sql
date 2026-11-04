-- Migration: anamnese pública preenchida pelo aluno.
-- Cada aluno recebe um token próprio, independente do token do treino.
-- O aluno pode abrir o link, responder e atualizar as respostas depois.
-- O personal continua editando a mesma anamnese pela área autenticada.

-- ---------------------------------------------------------------------------
-- 1. Token público da anamnese
-- ---------------------------------------------------------------------------

alter table public.students
  add column anamnesis_token varchar(64);

-- Preenche os alunos existentes com tokens únicos.
update public.students
set anamnesis_token = encode(gen_random_bytes(32), 'hex')
where anamnesis_token is null;

alter table public.students
  alter column anamnesis_token set default encode(gen_random_bytes(32), 'hex');

alter table public.students
  alter column anamnesis_token set not null;

alter table public.students
  add constraint students_anamnesis_token_key unique (anamnesis_token);

alter table public.students
  add constraint students_anamnesis_token_length
  check (length(anamnesis_token) between 32 and 64);

comment on column public.students.anamnesis_token
  is 'Token público usado pelo aluno para preencher e atualizar a própria anamnese.';

-- ---------------------------------------------------------------------------
-- 2. Leitura pública da anamnese pelo token
-- ---------------------------------------------------------------------------

-- Retorna apenas o necessário para o aluno responder o formulário.
-- O token do treino é incluído para oferecer o atalho "Ver meu treino".
create or replace function public.get_public_anamnesis(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return null;
  end if;

  select jsonb_build_object(
    'student_name', s.name,
    'updated_at', sa.updated_at,
    'workout_access_token', (
      select wp.access_token
      from public.workout_plans wp
      where wp.student_id = s.id
        and wp.is_active = true
      order by wp.created_at desc
      limit 1
    ),
    'anamnesis', case
      when sa.id is null then null
      else jsonb_build_object(
        'primary_goal', sa.primary_goal,
        'experience_level', sa.experience_level,
        'weekly_frequency', sa.weekly_frequency,
        'joint_pains', sa.joint_pains,
        'medical_conditions', sa.medical_conditions,
        'additional_notes', sa.additional_notes
      )
    end
  )
  into v_result
  from public.students s
  left join public.student_anamneses sa on sa.student_id = s.id
  where s.anamnesis_token = p_token;

  return v_result;
end;
$$;

revoke all on function public.get_public_anamnesis(text) from public;
grant execute on function public.get_public_anamnesis(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Gravação pública da anamnese pelo token
-- ---------------------------------------------------------------------------

-- Cria ou atualiza a anamnese do aluno dono do token.
-- As validações repetem as restrições da tabela para devolver mensagens claras.
create or replace function public.save_public_anamnesis(
  p_token text,
  p_primary_goal text,
  p_experience_level text,
  p_weekly_frequency integer,
  p_joint_pains jsonb,
  p_medical_conditions jsonb,
  p_additional_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_primary_goal text;
  v_experience_level text;
  v_additional_notes text;
  v_row public.student_anamneses;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'Link de anamnese inválido.'
      using errcode = 'P0002';
  end if;

  select id
  into v_student_id
  from public.students
  where anamnesis_token = p_token;

  if v_student_id is null then
    raise exception 'Link de anamnese inválido ou expirado.'
      using errcode = 'P0002';
  end if;

  v_primary_goal := left(trim(coalesce(p_primary_goal, '')), 100);
  v_experience_level := left(trim(coalesce(p_experience_level, '')), 50);
  v_additional_notes := nullif(
    left(trim(coalesce(p_additional_notes, '')), 2000),
    ''
  );

  if length(v_primary_goal) = 0 then
    raise exception 'Informe o objetivo principal.';
  end if;

  if length(v_experience_level) = 0 then
    raise exception 'Informe o nível de experiência.';
  end if;

  if p_weekly_frequency is null
    or p_weekly_frequency < 1
    or p_weekly_frequency > 14 then
    raise exception 'Informe uma frequência semanal entre 1 e 14.';
  end if;

  if jsonb_typeof(coalesce(p_joint_pains, '[]'::jsonb)) <> 'array' then
    raise exception 'A lista de dores está em formato inválido.';
  end if;

  if jsonb_typeof(coalesce(p_medical_conditions, '[]'::jsonb)) <> 'array' then
    raise exception 'A lista de condições de saúde está em formato inválido.';
  end if;

  insert into public.student_anamneses as sa (
    student_id,
    primary_goal,
    experience_level,
    weekly_frequency,
    joint_pains,
    medical_conditions,
    additional_notes
  )
  values (
    v_student_id,
    v_primary_goal,
    v_experience_level,
    p_weekly_frequency,
    coalesce(p_joint_pains, '[]'::jsonb),
    coalesce(p_medical_conditions, '[]'::jsonb),
    v_additional_notes
  )
  on conflict (student_id) do update
  set
    primary_goal = excluded.primary_goal,
    experience_level = excluded.experience_level,
    weekly_frequency = excluded.weekly_frequency,
    joint_pains = excluded.joint_pains,
    medical_conditions = excluded.medical_conditions,
    additional_notes = excluded.additional_notes
  returning sa.* into v_row;

  return jsonb_build_object(
    'updated_at', v_row.updated_at
  );
end;
$$;

revoke all on function public.save_public_anamnesis(
  text, text, text, integer, jsonb, jsonb, text
) from public;
grant execute on function public.save_public_anamnesis(
  text, text, text, integer, jsonb, jsonb, text
) to anon, authenticated;

comment on function public.get_public_anamnesis(text)
  is 'Retorna a anamnese do aluno pelo token público, sem expor outros dados.';
comment on function public.save_public_anamnesis(
  text, text, text, integer, jsonb, jsonb, text
)
  is 'Cria ou atualiza a anamnese do aluno pelo token público.';
