# QR Personel Platform

Multi-tenant personel devam, puantaj, maaş ve iletişim platformu.

## Hızlı Başlangıç (Windows)

```bash
# 1. Bağımlılıklar (pnpm workspace — npm install çalışmaz)
npx pnpm@9.15.0 install

# 2. İlk kurulum (DB + demo veri)
npx pnpm@9.15.0 run setup

# 3. Başlat (API + Web birlikte)
npm start
```

> **Not:** `pnpm` global kurulu değilse `npx pnpm@9.15.0` kullanın.  
> Docker yoksa SQLite modu otomatik devreye girer (`apps/api/.env`).

- **Web Admin:** http://localhost:5173  
- **API:** http://localhost:3001/api  

### Demo Hesaplar

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | admin@demo.com | Admin123! |
| Personel | personel@demo.com | Personel123! |

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run setup` | İlk kurulum: DB oluştur, demo veri yükle |
| `npm start` | Geliştirme sunucularını başlat (API + Web) |
| `npm run dev` | Aynı — API + Web |
| `npm run dev:api` | Sadece API |
| `npm run dev:web` | Sadece web panel |
| `npm run dev:mobile` | Expo mobil uygulama |
| `npm run build` | Tüm projeyi derle |
| `npm run db:studio` | Prisma veritabanı arayüzü |

## Veritabanı (Docker — önerilen)

```bash
npm run docker:up         # PostgreSQL + Redis + Evolution API
npm run evolution:setup   # WhatsApp instance (QR kod)
npm run setup             # DB şema + demo veri
npm start
```

Docker yoksa Evolution'ı lokal çalıştır: [services/evolution/README.md](services/evolution/README.md)

```bash
npm run evolution:install   # İlk kurulum (bir kez)
npm run evolution:local     # Evolution sunucusu
npm run evolution:setup     # Instance + QR
npm start
```

Docker yoksa `apps/api/.env.sqlite.example` → `.env` olarak kopyalayın (SQLite modu).

## Mobil

```bash
npm run dev:mobile
```

Fiziksel cihazda test için `apps/mobile/app.json` → `extra.apiUrl` değerini bilgisayar IP'niz ile güncelleyin.

## Stack

- API: NestJS + Prisma + SQLite/PostgreSQL
- Web: React + Vite + Tailwind
- Mobil: React Native + Expo
