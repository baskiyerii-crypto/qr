# Docker — PostgreSQL, Redis & Evolution API



Proje kökündeki `docker-compose.yml` şu servisleri çalıştırır:



| Servis | Port | Kullanım |

|--------|------|----------|

| **postgres** | 5432 | Ana veritabanı (QR Personel) |

| **redis** | 6379 | Bildirim kuyruğu (BullMQ) |

| **evolution-postgres** | 5433 | Evolution API veritabanı |

| **evolution-api** | 8080 | WhatsApp Evolution API sunucusu |

| **evolution-manager** | 8082 | Evolution yönetim paneli (QR kod) |



## Gereksinim



[Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) kurulu ve çalışır durumda olmalı.



## Komutlar



```bash

npm run docker:up         # Tüm servisleri başlat

npm run evolution:setup   # WhatsApp instance oluştur + QR talimatları

npm run docker:down       # Durdur

npm run docker:logs       # Canlı loglar

npm run setup             # Docker + DB + Evolution + demo veri (ilk kurulum)

```



## Bağlantı bilgileri



```

PostgreSQL:     postgresql://qr:qr_dev_password@localhost:5432/qr_personel

Redis:          redis://localhost:6379

Evolution API:  http://localhost:8080

Evolution DB:   postgresql://evolution:evolution_dev_password@localhost:5433/evolution_api

Manager UI:     http://localhost:8082

```



`apps/api/.env` içindeki Evolution ayarları (docker ile uyumlu):



```

EVOLUTION_API_URL=http://localhost:8080

EVOLUTION_API_KEY=qr_evolution_dev_key_7f3a9b2c

EVOLUTION_INSTANCE_NAME=qr-personel

```



## WhatsApp bağlantısı
 


1. `npm run docker:up` — Evolution API ayağa kalkar

2. `npm run evolution:setup` — `qr-personel` instance'ı oluşturulur

3. http://localhost:8082 adresinde instance seçip QR kodu tarayın

4. Bayi başvurusu onaylandığında / reddedildiğinde mesajlar otomatik gider



## Sorun giderme



- `docker: command not found` → Docker Desktop kurun ve bilgisayarı yeniden başlatın.

- Port 5432/8080 meşgul → İlgili servisi kapatın veya `docker-compose.yml` portunu değiştirin.

- Evolution API başlamıyor → `docker compose logs evolution-api` ile loglara bakın.

- Mesaj gitmiyor → Manager'da instance durumu "connected" olmalı; API `.env` anahtarları `docker/evolution.env` ile aynı olmalı.



## Production — Hetzner + Coolify



Kök dizindeki `docker-compose.prod.yml` tüm production stack'ini çalıştırır:

| Servis | Port (internal) | Açıklama |
|--------|-----------------|----------|
| **postgres** | 5432 | Ana veritabanı |
| **redis** | 6379 | Bildirim kuyruğu |
| **api** | 3001 | NestJS API (`Dockerfile.api`) |
| **web** | 80 | React panel + nginx (`Dockerfile.web`) |
| **evolution-*** | — | WhatsApp (opsiyonel, `whatsapp` profili) |



### 1. Ortam dosyası



```bash

cp docker/.env.production.example .env.production

# Şifreleri ve domain'leri düzenleyin

```



Zorunlu değişkenler: `POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `WEB_APP_URL`



### 2. Coolify kurulumu



1. Hetzner VPS (Ubuntu 24.04, min. 4 GB RAM) + [Coolify](https://coolify.io) kurun
2. DNS: `app.sizindomain.com` → sunucu IP (veya Coolify sslip.io domain)
3. Coolify → **New Resource** → **Docker Compose**
4. Git repo bağlayın, compose dosyası: `docker-compose.prod.yml`
5. Environment Variables: `.env.production` içeriğini Coolify UI'ya yapıştırın
   - `CORS_ORIGIN` ve `WEB_APP_URL` = Coolify domain'iniz (tam URL)
   - `DATABASE_URL` = Coolify PostgreSQL resource internal URL
6. Domain'i **sadece `web` servisine** bağlayın (port **80**)
   - `redis` veya `api` servisine domain bağlamayın → Traefik **404 page not found** verir
7. Deploy — `web` ve `api` healthy olana kadar bekleyin



İlk kurulumda demo veri için `RUN_DB_SEED=true` yapıp bir kez deploy edin, sonra `false` yapın.



### 2b. Coolify 404 troubleshooting



Tarayıcıda düz metin `404 page not found` görürseniz (Nginx/React değil, Traefik):

1. Domain **`web`** + port **80** mi? (`redis`/`api` olmamalı)
2. `web` servisi Running/Healthy mi? (`api` healthy olmadan `web` başlamaz)
3. `api` loglarında `DATABASE_URL` / Prisma hatası var mı?
4. Redeploy sonrası `/` landing, `/health` API yanıtı dönmeli



### 3. WhatsApp (opsiyonel)



Coolify'da compose profiles desteklenmiyorsa sunucuda:



```bash

docker compose -f docker-compose.prod.yml --env-file .env.production --profile whatsapp up -d

```



`EVOLUTION_API_KEY` ve `EVOLUTION_POSTGRES_PASSWORD` değerlerini `.env.production` içinde ayarlayın.



### 4. Yerel production testi



```bash

cp docker/.env.production.example .env.production

# CORS_ORIGIN=http://localhost olarak bırakın

npm run docker:prod:up

# http://localhost (Coolify olmadan port yayınlamak için compose'a ports ekleyin)

```



`uploads` verisi `uploads_data` volume'ünde kalır; container yenilense de dosyalar silinmez.

