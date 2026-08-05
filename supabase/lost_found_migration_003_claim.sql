-- Direct claim flow for found_report (separate from the custodian-mediated
-- handover table): a claimant self-declares "this is mine", the finder's
-- contact is revealed to them, and once the finder confirms the physical
-- transfer, the claimant's identity is retained on the report for future
-- dispute resolution.
alter table found_report add column claimant_id uuid references auth.users(id);
alter table found_report add column claimed_at timestamptz;
alter table found_report add column transfer_completed_at timestamptz;
