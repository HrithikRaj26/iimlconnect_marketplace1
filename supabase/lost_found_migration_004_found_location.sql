-- "Where the item was found" — distinct from pickup_location (where it can
-- be collected, e.g. PGP Office for sensitive items). The matching
-- algorithm compares this against lost_report.last_seen_location; using
-- pickup_location for that comparison was wrong once sensitive items pin
-- pickup_location to "PGP Office" regardless of where they were actually found.
alter table found_report add column found_location text;

-- Same fix applied to the custodian queue's Postgres match_score() (used via
-- matching.ts's scoreNewLostReport/scoreNewFoundReport) — it was comparing
-- against pickup_location too, which is broken for every sensitive item
-- (always "PGP Office" regardless of where it was actually found).
create or replace function match_score(p_lost_id uuid, p_found_id uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  v_lost lost_report%rowtype;
  v_found found_report%rowtype;
  v_text_score numeric := 0;
  v_location_score numeric := 0;
  v_time_score numeric := 0;
  v_category_match boolean := false;
  v_total numeric := 0;
begin
  select * into v_lost from lost_report where id = p_lost_id;
  select * into v_found from found_report where id = p_found_id;

  if v_lost.id is null or v_found.id is null then
    return jsonb_build_object('score', 0, 'text_score', 0, 'location_score', 0, 'time_score', 0, 'category_match', false);
  end if;

  v_text_score := (
    coalesce(ts_rank_cd(v_lost.search_vector, plainto_tsquery('english', v_found.category || ' ' || v_found.description)), 0)
    +
    coalesce(ts_rank_cd(v_found.search_vector, plainto_tsquery('english', v_lost.category || ' ' || v_lost.description)), 0)
  ) / 2.0;
  v_text_score := least(v_text_score / 0.5, 1.0);

  v_category_match := lower(trim(v_lost.category)) = lower(trim(v_found.category));

  v_location_score := coalesce(
    ts_rank_cd(
      to_tsvector('english', coalesce(v_found.found_location, v_found.pickup_location, '')),
      plainto_tsquery('english', coalesce(v_lost.last_seen_location, ''))
    ), 0
  );
  v_location_score := least(v_location_score / 0.3, 1.0);

  if v_found.created_at::date >= v_lost.lost_date then
    v_time_score := 1.0;
  else
    v_time_score := 0.0;
  end if;

  v_total := (0.55 * v_text_score)
           + (0.15 * (case when v_category_match then 1.0 else 0.0 end))
           + (0.15 * v_location_score)
           + (0.15 * v_time_score);

  return jsonb_build_object(
    'score', greatest(0, least(1, v_total)),
    'text_score', v_text_score,
    'location_score', v_location_score,
    'time_score', v_time_score,
    'category_match', v_category_match
  );
end;
$$;
