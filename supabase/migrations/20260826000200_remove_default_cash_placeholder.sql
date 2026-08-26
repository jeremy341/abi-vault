-- Start new committees with a genuinely empty Kasse collection.
-- Historical data remains recoverable because the default wallet is archived,
-- not deleted.

update public.wallets
set status = 'archived'
where idempotency_key = 'cash-only-default'
   or (
     organization_id = 'org_local_demo'
     and name = 'Barkasse'
     and created_by = 'user_local_admin'
   );
