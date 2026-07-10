# KVKK Uyumluluk Notları

## Veri Sorumlusu / İşleyen

- Müşteri şirket: Veri sorumlusu (personel verileri)
- Platform: Veri işleyen (teknik altyapı)

## İşlenen Veriler

| Veri | Amaç | Saklama |
|------|------|---------|
| Kimlik/iletişim | Hesap yönetimi | Aktif süre + politika |
| Konum (anlık) | Giriş/çıkış doğrulama | Devam kaydı ile |
| Cihaz UUID | Hesap paylaşımı önleme | Cihaz kaydı süresi |
| Devam kayıtları | Puantaj, bordro | Şirket ayarı (varsayılan 730 gün) |

## Teknik Tedbirler

- Konum yalnızca check-in/out anında
- Sürekli arka plan GPS yok
- Tenant izolasyonu (company_id)
- HTTPS, JWT, rate limiting
- Audit log

## Ürün İçi

- Aydınlatma metni (`GET /kvkk/disclosure`)
- Onay kaydı (`POST /kvkk/consent`)
- Personel veri özeti (`GET /kvkk/my-data`)

## Önerilen Sözleşmeler

- Kullanım şartları
- Veri işleme sözleşmesi (DPA)
- Çalışan aydınlatma metni (hukuk onayı)
