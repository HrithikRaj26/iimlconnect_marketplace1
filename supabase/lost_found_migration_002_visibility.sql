-- "Show to public" toggle for lost_report: when false, the report is
-- withheld from other users in Browse/detail — visible only to the
-- reporter themselves and staff (custodian/admin). Matching still
-- considers the report regardless of this flag; it only affects who can
-- see it, not whether it can be matched.
alter table lost_report add column visible_to_public boolean not null default true;
