# Revolution POS Server

Backend i **Revolution Invest POS** — validim licence online, menaxhim klientësh, panel Super Admin dhe panel pronarësh.

## Stack

- Node.js 20+ · Express
- Supabase (PostgreSQL)
- JWT autentifikim
- Deploy: Railway

## URL

| Shërbim | URL |
|---------|-----|
| Supabase | `https://tdkpcgxcudxbvrtmpobi.supabase.co` |
| Railway | `https://earnest-success-production-9383.up.railway.app` |

## Setup lokal

```bash
cd revolution-pos-server
cp .env.example .env
# Plotëso SUPABASE_SERVICE_ROLE_KEY dhe JWT_SECRET
npm install
npm run dev
```

| Panel | URL |
|-------|-----|
| Super Admin | http://localhost:8080/panel |
| Pronarët | http://localhost:8080/owner/login |

## Supabase — krijo tabelat

1. Hyr në [Supabase Dashboard](https://supabase.com/dashboard) → projekti `tdkpcgxcudxbvrtmpobi`
2. **SQL Editor** → ngjit përmbajtjen e `supabase/schema.sql` → **Run**

Nëse ke ekzekutuar `schema.sql` më parë, ekzekuto vetëm `supabase/migrations/002_owners_sales.sql`.

## Variablat e mjedisit (Railway)

| Variabël | Përshkrimi |
|----------|------------|
| `SUPABASE_URL` | `https://tdkpcgxcudxbvrtmpobi.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Settings → API) — **jo** anon key |
| `JWT_SECRET` | String i gjatë random (min 16 karaktere) |
| `SUPER_ADMIN_EMAIL` | Email i panelit |
| `SUPER_ADMIN_PASSWORD` | Fjalëkalimi fillestar |
| `LICENSE_API_KEY` | (Opsionale) Kërkohet nga POS në header `x-api-key` |
| `PORT` | Railway e vendos automatikisht |

## API

### Validim licence (POS)

```http
POST /api/v1/license/validate
Content-Type: application/json
x-api-key: <opsionale>

{
  "celesi": "ABCD-EFGH-IJKL-MNOP",
  "device_id": "A1B2C3D4E5F6",
  "app_type": "restorant"
}
```

### Sinkronizim shitjesh (POS → server, kohë reale)

```http
POST /api/v1/sales/sync
Content-Type: application/json

{
  "celesi": "ABCD-EFGH-IJKL-MNOP",
  "device_id": "A1B2C3D4E5F6",
  "local_order_id": "42",
  "table_number": 5,
  "waiter_name": "Arben",
  "items": [{"name": "Pizza", "qty": 2, "price": 8}],
  "total": 16.00,
  "receipt_number": "R-001",
  "closed_at": "2026-06-20T18:30:00.000Z"
}
```

### Auth

- `POST /api/auth/login` — Super Admin `{ email, password }` → JWT
- `POST /api/auth/owner/login` — Pronar `{ email, password }` → JWT
- `POST /api/auth/logout` / `POST /api/auth/owner/logout`
- `GET /api/auth/me` — Super Admin (Bearer / cookie `rip_token`)
- `GET /api/auth/owner/me` — Pronar (Bearer / cookie `owner_token`)

### Admin (Super Admin, JWT)

- `GET /api/admin/stats`
- `GET|POST /api/admin/clients`
- `GET|POST /api/admin/licenses`
- `PATCH /api/admin/licenses/:id/status`
- `POST /api/admin/licenses/:id/reset-device`
- `GET /api/admin/owners` — lista e pronarëve
- `POST /api/admin/owners` — krijo pronar `{ client_id, emri, email, password }`
- `PATCH /api/admin/owners/:id/status` — `{ aktiv: true|false }`

### Owner (Pronar, JWT)

- `GET /api/owner/stats` — shitjet sot / javë / muaj
- `GET /api/owner/orders` — porositë e fundit
- `GET /api/owner/reports?from=YYYY-MM-DD&to=YYYY-MM-DD` — raport të ardhurash
- `GET /api/owner/client` — info restoranti

### Health

- `GET /health` — serveri online
- `GET /health/db` — test lidhje Supabase (kthen gabimin e saktë nëse dështon)

## Panelet web

### Super Admin (`/panel`)

Klientët, liçensat, **pronarët** (krijim + aktivizim/çaktivizim).

### Pronarët (`/owner/login` → `/owner/panel`)

- Vetëm restoranti i lidhur me llogarinë
- Statistika: sot, java, muaji
- Porositë e fundit
- Raportet e të ardhurave
- Responsive (telefon)

## POS Electron

Kur tavolina mbyllet ose printohet fatura, POS dërgon automatikisht shitjen te `/api/v1/sales/sync` duke përdorur çelësin e licencës së aktivizuar.

## Deploy Railway

1. Krijo projekt të ri në Railway → lidh repo `revolution-pos-server`
2. Shto variablat e mjedisit
3. Deploy automatik nga `railway.toml`

## Struktura

```
revolution-pos-server/
├── src/
│   ├── server.js
│   ├── db.js
│   ├── middleware/auth.js
│   ├── routes/ (auth, license, sales, admin, owner)
│   └── services/ (licenseService, salesService, userService)
├── public/
│   ├── panel.html          # Super Admin
│   └── owner/              # Panel pronarësh
├── supabase/schema.sql
└── railway.toml
```
