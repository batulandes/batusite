# BATU içerik admini

Bu fonksiyon `main` dalındaki değişikliklerde GitHub Actions ile deploy edilir.

Supabase Dashboard içinde **Edge Functions → tasarim-admin → Code** yolunu açın,
`index.ts` içeriğini yapıştırın ve **Deploy updates** seçeneğini kullanın.

Function ayarlarında **Verify JWT** kapalı olmalıdır. Edge Function secret olarak
`ADMIN_PASSWORD` tanımlı olmalıdır. `SUPABASE_URL` ve
`SUPABASE_SERVICE_ROLE_KEY`, Supabase tarafından barındırılan Edge Function'larda
otomatik sağlanır.

Fonksiyon, `tasarimlar` Storage bucket'ını bulamazsa public olarak oluşturur.
Veritabanında `tasarimlar` tablosunun şu alanları bulunmalıdır:

- `id`
- `baslik`
- `gorsel_url`
- `kategori`
- `yil`
- `aciklama`
- `sira`
- `yayinlandi`
- `created_at`

## Timelapse

Timelapse için ek bir veritabanı tablosu veya SQL çalıştırmak gerekmez. Fonksiyon,
ilk kariyer kaydı eklendiğinde public `timelapse` bucket'ını oluşturur. Kayıtları
`events.json`, yüklenen görsel ve videoları `media/` altında saklar.

Admin işlemleri:

- `timeline-list`
- `timeline-save`
- `timeline-toggle`
- `timeline-delete`

Edge Function istek sınırına takılmamak için yüklenen timelapse medyası en fazla
18 MB olabilir. Daha büyük videolar YouTube veya harici video bağlantısıyla
eklenebilir.
