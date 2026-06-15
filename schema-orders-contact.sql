-- Migrazione Cloudflare D1: aggiunge cellulare e consenso trattamento dati agli ordini
-- Eseguire su un database già esistente con: wrangler d1 execute <DB_NAME> --file=schema-orders-contact.sql --remote

ALTER TABLE orders ADD COLUMN customer_phone TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN privacy_accepted INTEGER DEFAULT 0;