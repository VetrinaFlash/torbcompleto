-- Migrazione: aggiunge tabella opzioni scelta obbligatoria
-- Eseguire con: npx wrangler d1 execute torb-db --file=schema-options.sql --remote

CREATE TABLE IF NOT EXISTS product_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
