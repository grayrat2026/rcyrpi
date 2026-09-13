-- 07: payment gateway info (real wallet TrxID + method label)
-- The PipraPay verify-payment response carries the actual mobile-wallet
-- transaction id (e.g. Nagad "75XODPOF"), the wallet label ("Nagad
-- Personal") and the sender number. We store them on the payment record
-- so receipts show the REAL TrxID instead of only the internal RCY- ref.
alter table public.payments add column if not exists gateway_trxid text;
alter table public.payments add column if not exists gateway_method text;
