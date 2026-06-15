-- ============================================================
-- TORB Birreria Carnivora - Schema D1 completo con seed
-- Eseguire tramite: wrangler d1 execute torb-db --file=schema.sql
-- ============================================================

-- Tabella impostazioni chiave-valore
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Categorie menu
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍴',
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1
);

-- Prodotti menu
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price REAL NOT NULL,
  image_url TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  mandatory_choice INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Ordini
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  privacy_accepted INTEGER DEFAULT 0,
  pickup_time TEXT NOT NULL,
  notes TEXT DEFAULT '',
  items_json TEXT NOT NULL,
  subtotal REAL NOT NULL,
  discount_rate REAL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT DEFAULT 'nuovo',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- Clienti (CRM)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  order_count INTEGER DEFAULT 1,
  total_spent REAL DEFAULT 0,
  first_order_at TEXT,
  last_order_at TEXT
);

-- ============================================================
-- SEED: Impostazioni default
-- ============================================================
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('whatsapp_number', '393759084330'),
  ('promo_bar_text', 'SCONTO 10% SOPRA I 20€ | SCONTO 20% SOPRA I 50€'),
  ('store_override_open', ''),
  ('opening_hours', '{"1":null,"2":{"open":"19:00","close":"01:00"},"3":{"open":"19:00","close":"01:00"},"4":{"open":"19:00","close":"01:00"},"5":{"open":"19:00","close":"02:30"},"6":{"open":"19:00","close":"02:30"},"0":{"open":"19:00","close":"01:00"}}');

-- ============================================================
-- SEED: Categorie
-- ============================================================
INSERT OR IGNORE INTO categories (id, name, icon, sort_order) VALUES
  ('tapas',          'Tapas',             '🍗', 1),
  ('patate',         'Le Patate',          '🍟', 2),
  ('burgers',        'Burgers',            '🍔', 3),
  ('bistecche',      'Le Bistecche',       '🥩', 4),
  ('carne',          'La Carne',           '🔪', 5),
  ('contorni',       'I Contorni',         '🥗', 6),
  ('dolci',          'Dolci',              '🍮', 7),
  ('bibite',         'Le Bibite',          '🥤', 8),
  ('birre-spina',    'Birre alla Spina',   '🍺', 9),
  ('birre-bottiglia','Birre in Bottiglia', '🍾', 10),
  ('bollicine',      'Bollicine',          '🥂', 11),
  ('vini-bianchi',   'Vini Bianchi',       '🍷', 12),
  ('vini-rosati',    'Vini Rosati',        '🌸', 13),
  ('vini-rossi',     'Vini Rossi',         '🍷', 14);

-- ============================================================
-- SEED: Prodotti Tapas
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (101, 'tapas', 'Pollo Crispy', 'Filetti di pollo, panatura Cornflakes, salsa Torb. 4pz', 9.00, 1),
  (102, 'tapas', 'Polpette Pulled', 'Polpette di Pulled Pork, panatura alle mandorle, salsa bbq. 4pz', 9.50, 2),
  (103, 'tapas', 'Mini Bun', 'Mini Bun, salsiccia sbriciolata, peperoncini verdi, mayo all''aglio. 2pz', 9.50, 3),
  (104, 'tapas', 'Tacos Beef', 'Tacos, stracotto di Angus, cipolla caramellata, mayo fondo bruno. 2pz', 12.00, 4),
  (105, 'tapas', 'Beef Nuggets', 'Stracotto di Black Angus, panatura Cornflakes, chutney di peperoni. 4pz', 9.00, 5),
  (106, 'tapas', 'Polpette Black Angus', 'Polpette di Black Angus, fonduta di Parmigiano Reggiano. 4pz', 9.50, 6),
  (107, 'tapas', 'Patanegra (100gr)', 'Jamon de Bellota 100%, pan de tomate.', 26.00, 7);

-- ============================================================
-- SEED: Prodotti Le Patate
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (201, 'patate', 'Fritte Classiche', '', 5.00, 1),
  (202, 'patate', 'Salsiccia e Fonduta', '', 7.50, 2),
  (203, 'patate', 'Cheddar e Bacon', '', 7.00, 3);

-- ============================================================
-- SEED: Prodotti Burgers
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (301, 'burgers', 'Torb Burger 180g', 'Hamburger Selezione de Matteo 180gr, insalata, pomodoro, cheddar, bacon, cipolla croccante, salsa Torb.', 13.00, 1),
  (302, 'burgers', 'Torb Burger 250g', 'Hamburger Selezione de Matteo 250gr, insalata, pomodoro, cheddar, bacon, cipolla croccante, salsa Torb.', 15.50, 2),
  (303, 'burgers', 'Torb Burger Wagyu', 'Hamburger Wagyu, insalata, pomodoro, cheddar, bacon, cipolla croccante, salsa Torb.', 22.50, 3),
  (304, 'burgers', 'Luca 180g', 'Hamburger Selezione de Matteo 180gr, insalata, guanciale croccante, caprino, chutney di pere, noci.', 13.50, 4),
  (305, 'burgers', 'Luca 250g', 'Hamburger Selezione de Matteo 250gr, insalata, guanciale croccante, caprino, chutney di pere, noci.', 16.00, 5),
  (306, 'burgers', 'Luca Wagyu', 'Hamburger Wagyu, insalata, guanciale croccante, caprino, chutney di pere, noci.', 23.00, 6),
  (307, 'burgers', 'Peperoncino 180g', 'Hamburger Selezione de Matteo 180gr, peperoncini verdi, provola, tarallo sbriciolato, mayo all''aglio.', 13.00, 7),
  (308, 'burgers', 'Peperoncino 250g', 'Hamburger Selezione de Matteo 250gr, peperoncini verdi, provola, tarallo sbriciolato, mayo all''aglio.', 15.50, 8),
  (309, 'burgers', 'Peperoncino Wagyu', 'Hamburger Wagyu, peperoncini verdi, provola, tarallo sbriciolato, mayo all''aglio.', 22.50, 9),
  (310, 'burgers', 'Patanegra Burger 180g', 'Hamburger Selezione de Matteo 180gr, Jamon de Bellota 100%, provola, rucola, pomodori in doppia consistenza.', 19.00, 10),
  (311, 'burgers', 'Patanegra Burger 250g', 'Hamburger Selezione de Matteo 250gr, Jamon de Bellota 100%, provola, rucola, pomodori in doppia consistenza.', 21.00, 11),
  (312, 'burgers', 'Patanegra Burger Wagyu', 'Hamburger Wagyu, Jamon de Bellota 100%, provola, rucola, pomodori in doppia consistenza.', 27.00, 12),
  (313, 'burgers', 'Bun Daniel''s 180g', 'Hamburger Selezione de Matteo 180gr, pesto di basilico, prosciutto San Daniele, pomodorini confit, ricotta al limone.', 14.00, 13),
  (314, 'burgers', 'Bun Daniel''s 250g', 'Hamburger Selezione de Matteo 250gr, pesto di basilico, prosciutto San Daniele, pomodorini confit, ricotta al limone.', 16.00, 14),
  (315, 'burgers', 'Bun Daniel''s Wagyu', 'Hamburger Wagyu, pesto di basilico, prosciutto San Daniele, pomodorini confit, ricotta al limone.', 23.50, 15),
  (316, 'burgers', 'Purple Cheese 180g', 'Hamburger Selezione de Matteo 180gr, cheddar, bacon, cipolle caramellate, cavolo viola.', 13.00, 16),
  (317, 'burgers', 'Purple Cheese 250g', 'Hamburger Selezione de Matteo 250gr, cheddar, bacon, cipolle caramellate, cavolo viola.', 15.50, 17),
  (318, 'burgers', 'Purple Cheese Wagyu', 'Hamburger Wagyu, cheddar, bacon, cipolle caramellate, cavolo viola.', 22.50, 18),
  (319, 'burgers', 'Pulled Pork', 'Pulled Pork, chutney di peperoni, mayo al fondo bruno, patate al forno, mandorle tostate.', 11.00, 19),
  (320, 'burgers', 'Chicken', 'Pollo con panatura Cornflakes, provola, insalata, mayo.', 11.00, 20),
  (321, 'burgers', 'Doppio Pollo', 'Doppio pollo con panatura Cornflakes, provola, insalata, mayo.', 14.00, 21);

-- ============================================================
-- SEED: Le Bistecche
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (401, 'bistecche', 'T-Bone 700/800g', 'Peso: 700/800 circa. Cottura: Medio/Sangue. 1 Contorno incluso.', 64.00, 1),
  (402, 'bistecche', 'Costata 700/800g', 'Peso: 700/800 circa. Cottura: Medio/Sangue. 1 Contorno incluso.', 64.00, 2);

-- ============================================================
-- SEED: La Carne
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (501, 'carne', 'Filetto 250gr', 'Abbinamenti: Fondo Bruno e Patate al Forno, Fonduta di Parmigiano, Crema di Pistacchio, Pecorino e Tartufo, o Contorno a Scelta.', 30.00, 1),
  (502, 'carne', 'Tagliata 300gr', 'Abbinamenti: Fondo Bruno e Patate al Forno, Fonduta di Parmigiano, Crema di Pistacchio, Pecorino e Tartufo, o Contorno a Scelta.', 30.00, 2),
  (503, 'carne', 'Hamburger 250gr al piatto', 'Abbinamenti: Fondo Bruno e Patate al Forno, Fonduta di Parmigiano, Crema di Pistacchio, Pecorino e Tartufo, o Contorno a Scelta.', 15.00, 3);

-- ============================================================
-- SEED: I Contorni
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (601, 'contorni', 'Patate Fritte', '', 5.00, 1),
  (602, 'contorni', 'Patate al Forno', '', 5.00, 2),
  (603, 'contorni', 'Insalata Verde', '', 4.00, 3),
  (604, 'contorni', 'Rucola e Pomodorini', '', 5.00, 4);

-- ============================================================
-- SEED: Dolci
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (701, 'dolci', 'Birramisù', 'Mousse al mascarpone, crema alla birra, crumble al burro.', 7.00, 1),
  (702, 'dolci', 'Pastiera', 'Versione scomposta con crumble al burro, ricotta e grano.', 7.00, 2),
  (703, 'dolci', 'Tiramisù', 'Savoiardo al caffè, cuore di cioccolato caramello, mousse al mascarpone.', 7.00, 3),
  (704, 'dolci', 'Cheesecake', 'Crumble al burro, crema al formaggio, composta ai frutti rossi.', 7.00, 4);

-- ============================================================
-- SEED: Le Bibite
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (801, 'bibite', 'Acqua Ferrarelle', '', 3.00, 1),
  (802, 'bibite', 'Acqua Electa', '', 3.00, 2),
  (803, 'bibite', 'Coca Cola', '', 3.00, 3),
  (804, 'bibite', 'Coca Zero', '', 3.00, 4),
  (805, 'bibite', 'Coca Zero Caffeina', '', 3.00, 5),
  (806, 'bibite', 'Fanta', '', 3.00, 6);

-- ============================================================
-- SEED: Birre alla Spina
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (901, 'birre-spina', 'Krombacher Pils 20cl', 'Dorata - Pils (4.8%)', 3.50, 1),
  (902, 'birre-spina', 'Krombacher Pils 40cl', 'Dorata - Pils (4.8%)', 6.00, 2),
  (903, 'birre-spina', 'Torb 20cl', 'Ambrata - Smoked Ale (5.8%)', 4.00, 3),
  (904, 'birre-spina', 'Torb 40cl', 'Ambrata - Smoked Ale (5.8%)', 7.00, 4);

-- ============================================================
-- SEED: Birre in Bottiglia
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (1001, 'birre-bottiglia', 'Adelaide APA - Flea 33cl', 'American Pale Ale', 8.50, 1),
  (1002, 'birre-bottiglia', 'Bastola Imperial Red Ale - Flea 33cl', 'Imperial Red Ale', 8.50, 2),
  (1003, 'birre-bottiglia', 'Costanza Blonde Ale - Flea 33cl', 'Blonde Ale', 8.50, 3),
  (1004, 'birre-bottiglia', 'Gouden Carolus Ambrio 33cl', 'Belgian Amber Ale (8%)', 9.50, 4),
  (1005, 'birre-bottiglia', 'Krombacher Alkoholfree 33cl', 'Pils analcolica (0%)', 4.00, 5);

-- ============================================================
-- SEED: Bollicine
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (1101, 'bollicine', 'Prosecco Doc Frescobaldi', '', 25.00, 1),
  (1102, 'bollicine', 'Dubl Brut', 'Feudi di San Gregorio', 50.00, 2),
  (1103, 'bollicine', 'Ca'' del Bosco Prestige', '', 70.00, 3);

-- ============================================================
-- SEED: Vini Bianchi
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (1201, 'vini-bianchi', 'Greco di Tufo Docg', 'Feudi di San Gregorio', 25.00, 1),
  (1202, 'vini-bianchi', 'Fiano di Avellino Doc', 'Feudi di San Gregorio', 25.00, 2),
  (1203, 'vini-bianchi', 'Falanghina Doc', 'Feudi di San Gregorio', 22.00, 3);

-- ============================================================
-- SEED: Vini Rosati
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (1301, 'vini-rosati', 'Alie Toscana Igt', 'Frescobaldi', 24.00, 1),
  (1302, 'vini-rosati', 'Dubl Rosé Brut', 'Feudi di San Gregorio', 50.00, 2);

-- ============================================================
-- SEED: Vini Rossi
-- ============================================================
INSERT OR IGNORE INTO products (id, category_id, name, description, price, sort_order) VALUES
  (1401, 'vini-rossi', 'Sabbienere', 'Aglianico Irpinia Doc - Feudi di San Gregorio', 25.00, 1),
  (1402, 'vini-rossi', 'Erre', 'Falerno del Massico Doc - Trabucco', 27.00, 2),
  (1403, 'vini-rossi', 'Terra d''Eclano', 'Aglianico Irpinia Doc - Quintodecimo', 60.00, 3),
  (1404, 'vini-rossi', 'Selva di Luoti', 'Taurasi Docg - Feudi di San Gregorio', 45.00, 4),
  (1405, 'vini-rossi', 'Gragnano Doc', 'Antiche Radici', 19.00, 5);
