# Evolution API — Lokal (Docker yok)

Docker kurmadan WhatsApp Evolution API'yi Windows'ta çalıştırır.

## Gereksinim

- Node.js 20+
- Git: https://git-scm.com/download/win

## İlk kurulum (bir kez)

```bash
npm run evolution:install
```

## Çalıştırma

Evolution **sürekli açık** kalmalı — kapandığında WhatsApp mesajları gitmez.

**Terminal 1** — Evolution sunucusu:
```bash
npm run evolution:local
```

**Terminal 2** — Ana uygulama:
```bash
npm start
```

## WhatsApp QR (sadece süper admin)

Açık QR adresi yok. Panelden erişin:

1. http://localhost:5173/login → `super@qr.com` / `Super123!`
2. **Platform Yönetimi** → **WhatsApp QR** (`/admin/whatsapp`)
3. Telefondan WhatsApp → Bağlı Cihazlar → QR tara

Bayi, şirket admini ve personel bu sayfaya erişemez.

## Bağlantı bilgileri

| | |
|--|--|
| Evolution API | http://127.0.0.1:8080 (lokal) |
| Admin QR | http://localhost:5173/admin/whatsapp |
| PostgreSQL | localhost:5433 |
| Instance | `qr-personel` |

## Sorun giderme

- **Mesaj gitmiyor** → Evolution çalışıyor mu? Admin panelde durum "Bağlı" mı?
- **Port 8080 meşgul** → İlgili süreci kapat
- **Kurulum yarım kaldı** → `services/evolution-api` sil, `npm run evolution:install` tekrar
