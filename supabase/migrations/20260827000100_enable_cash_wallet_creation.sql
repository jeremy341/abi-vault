-- The cash-only policy disables bank-wallet creation, but the application
-- server action still needs to call the guarded wallet RPC for cash wallets.
grant execute on function public.create_wallet(text, text, public.wallet_type, text, uuid, text)
  to authenticated;
