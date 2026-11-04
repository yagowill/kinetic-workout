-- Migration: inclui o nome do aluno na leitura pública do plano.
-- A PWA do aluno precisa exibir o nome sem expor outras tabelas.
-- O token continua sendo a única credencial e o access_token não é retornado.

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
    'student_name', (
      select s.name
      from public.students s
      where s.id = wp.student_id
    ),
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
