# tasarim-admin

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
