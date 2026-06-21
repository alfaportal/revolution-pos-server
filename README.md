# Revolution POS Server

Backend i **Revolution Invest POS** — validim licence online, menaxhim klientësh dhe panel Super Admin.

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

Hap: http://localhost:8080/panel

## Supabase — krijo tabelat

1. Hyr në [Supabase Dashboard](https://supabase.com/dashboard) → projekti `tdkpcgxcudxbvrtmpobi`
2. **SQL Editor** → ngjit përmbajtjen e `supabase/schema.sql` → **Run**

## Variablat e mjedisit (Railway)

| Variabël | Përshkrimi |
|----------|------------|
| `SUPABASE_URL` | `https://tdkpcgxcudxbvrtmpobi.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Settings → API) |
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

**Përgjigje (sukses):**
```json
{
  "valid": true,
  "client_name": "Restorant Drita",
  "client_type": "restorant",
  "valid_until": "2027-06-20",
  "message": "Liçenca është aktive."
}
```

### Auth

- `POST /api/auth/login` — `{ email, password }` → JWT
- `POST /api/auth/logout`
- `GET /api/auth/me` — Bearer token

### Admin (Super Admin, JWT)

- `GET /api/admin/stats`
- `GET|POST /api/admin/clients`
- `GET|POST /api/admin/licenses`
- `PATCH /api/admin/licenses/:id/status` — `{ statusi: "aktive"|"revokuar"|... }`
- `POST /api/admin/licenses/:id/reset-device`

### Health

- `GET /health`

## Panel Super Admin

`/panel` — shikon klientët, liçensat, krijon të rinj, revokon/aktivizon.

Super Admin krijohet automatikisht në start nëse nuk ekziston (nga env).

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
│   ├── routes/ (auth, license, admin)
│   └── services/licenseService.js
├── public/ (panel web)
├── supabase/schema.sql
└── railway.toml
```
