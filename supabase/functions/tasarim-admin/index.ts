import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DESIGN_BUCKET = "tasarimlar";
const TIMELAPSE_BUCKET = "timelapse";
const TIMELAPSE_INDEX = "events.json";
const MAX_TIMELAPSE_MEDIA_SIZE = 18 * 1024 * 1024;

type SupabaseClient = ReturnType<typeof createClient>;

type TimelineEvent = {
  id: string;
  baslik: string;
  aciklama: string | null;
  tur: "basari" | "ilk" | "kilometre" | "diger";
  yil: number;
  ay: number | null;
  gun: number | null;
  medya_url: string | null;
  medya_turu: "gorsel" | "video" | null;
  dosya_yolu: string | null;
  yayinlandi: boolean;
  created_at: string;
  updated_at: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function errorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  if (error && typeof error === "object") {
    const source = error as Record<string, unknown>;

    return {
      message:
        typeof source.message === "string"
          ? source.message
          : "Supabase işlemi başarısız oldu.",
      code: source.code ?? null,
      details: source.details ?? null,
      hint: source.hint ?? null,
      statusCode: source.statusCode ?? source.status ?? null,
      originalError: source.originalError ?? null,
    };
  }

  return {
    message:
      typeof error === "string"
        ? error
        : "Bilinmeyen bir sunucu hatası oluştu.",
  };
}

function safeFilename(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() || "bin";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "bin";

  return `${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;
}

function storagePathFromUrl(url: string, bucket: string) {
  const marker = `/object/public/${bucket}/`;
  const index = url.indexOf(marker);

  if (index < 0) return null;

  return decodeURIComponent(url.slice(index + marker.length));
}

function numberOrNull(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function sortTimeline(events: TimelineEvent[]) {
  return [...events].sort((a, b) => {
    const aValue = a.yil * 10000 + (a.ay || 0) * 100 + (a.gun || 0);
    const bValue = b.yil * 10000 + (b.ay || 0) * 100 + (b.gun || 0);

    return aValue - bValue || a.created_at.localeCompare(b.created_at);
  });
}

async function ensurePublicBucket(supabase: SupabaseClient, name: string) {
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) throw listError;

  const bucket = buckets?.find((item) => item.name === name);

  if (!bucket) {
    const { error } = await supabase.storage.createBucket(name, {
      public: true,
    });

    if (error) throw error;
    return;
  }

  if (!bucket.public) {
    const { error } = await supabase.storage.updateBucket(name, {
      public: true,
    });

    if (error) throw error;
  }
}

async function readTimeline(supabase: SupabaseClient): Promise<TimelineEvent[]> {
  const { data, error } = await supabase.storage
    .from(TIMELAPSE_BUCKET)
    .download(TIMELAPSE_INDEX);

  if (error) {
    const details = errorDetails(error);
    const message = String(details.message || "").toLowerCase();
    const status = String(details.statusCode || details.code || "");

    if (
      status === "404" ||
      message.includes("not found") ||
      message.includes("does not exist")
    ) {
      return [];
    }

    throw error;
  }

  const content = await data.text();
  if (!content.trim()) return [];

  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeTimeline(
  supabase: SupabaseClient,
  events: TimelineEvent[],
) {
  await ensurePublicBucket(supabase, TIMELAPSE_BUCKET);

  const content = new Blob(
    [JSON.stringify(sortTimeline(events), null, 2)],
    { type: "application/json" },
  );

  const { error } = await supabase.storage
    .from(TIMELAPSE_BUCKET)
    .upload(TIMELAPSE_INDEX, content, {
      contentType: "application/json; charset=utf-8",
      cacheControl: "0",
      upsert: true,
    });

  if (error) throw error;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Yalnızca POST isteği destekleniyor." }, 405);
  }

  const adminPassword = Deno.env.get("ADMIN_PASSWORD");
  const suppliedPassword = request.headers.get("x-admin-password");

  if (!adminPassword) {
    return json({ error: "ADMIN_PASSWORD secret tanımlanmamış." }, 500);
  }

  if (!suppliedPassword || suppliedPassword !== adminPassword) {
    return json({ error: "Yönetim şifresi yanlış." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase servis değişkenleri bulunamadı." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const contentType = request.headers.get("content-type") || "";
    let action = "";
    let form: FormData | null = null;
    let body: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      form = await request.formData();
      action = String(form.get("action") || "");
    } else {
      body = await request.json();
      action = String(body.action || "");
    }

    if (action === "check") {
      return json({ ok: true });
    }

    if (action === "list") {
      const { data, error } = await supabase
        .from("tasarimlar")
        .select("*")
        .order("sira", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return json({ designs: data || [] });
    }

    if (action === "upload") {
      if (!form) return json({ error: "Yükleme formu alınamadı." }, 400);

      const file = form.get("file");

      if (!(file instanceof File) || file.size === 0) {
        return json({ error: "Geçerli bir görsel seç." }, 400);
      }

      if (!file.type.startsWith("image/")) {
        return json({ error: "Yalnızca görsel dosyaları yüklenebilir." }, 400);
      }

      await ensurePublicBucket(supabase, DESIGN_BUCKET);

      const path = safeFilename(file.name);
      const { error: uploadError } = await supabase.storage
        .from(DESIGN_BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(DESIGN_BUCKET)
        .getPublicUrl(path);

      const row = {
        baslik: String(form.get("baslik") || "").trim() || null,
        kategori: String(form.get("kategori") || "").trim() || null,
        yil: form.get("yil") ? Number(form.get("yil")) : null,
        aciklama: String(form.get("aciklama") || "").trim() || null,
        sira: Number(form.get("sira") || 0),
        yayinlandi: String(form.get("yayinlandi")) === "true",
        gorsel_url: publicUrlData.publicUrl,
        dosya_yolu: path,
      };

      const { data, error: insertError } = await supabase
        .from("tasarimlar")
        .insert(row)
        .select()
        .single();

      if (insertError) {
        await supabase.storage.from(DESIGN_BUCKET).remove([path]);
        throw insertError;
      }

      return json({ design: data });
    }

    if (action === "toggle") {
      const { error } = await supabase
        .from("tasarimlar")
        .update({ yayinlandi: Boolean(body.yayinlandi) })
        .eq("id", body.id);

      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "delete") {
      const { data: design, error: findError } = await supabase
        .from("tasarimlar")
        .select("gorsel_url, dosya_yolu")
        .eq("id", body.id)
        .single();

      if (findError) throw findError;

      const path =
        design.dosya_yolu ||
        storagePathFromUrl(design.gorsel_url || "", DESIGN_BUCKET);

      if (path) {
        const { error } = await supabase.storage
          .from(DESIGN_BUCKET)
          .remove([path]);

        if (error) throw error;
      }

      const { error } = await supabase
        .from("tasarimlar")
        .delete()
        .eq("id", body.id);

      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "timeline-list") {
      return json({ events: sortTimeline(await readTimeline(supabase)) });
    }

    if (action === "timeline-save") {
      if (!form) return json({ error: "Timelapse formu alınamadı." }, 400);

      const id = String(form.get("id") || "").trim();
      const baslik = String(form.get("baslik") || "").trim();
      const tur = String(form.get("tur") || "diger");
      const yil = numberOrNull(form.get("yil"));
      const ay = numberOrNull(form.get("ay"));
      const gun = numberOrNull(form.get("gun"));
      const validTypes = ["basari", "ilk", "kilometre", "diger"];

      if (!baslik) return json({ error: "Başlık zorunlu." }, 400);
      if (!yil || yil < 1900 || yil > 2100) {
        return json({ error: "Geçerli bir yıl yaz." }, 400);
      }
      if (ay !== null && (ay < 1 || ay > 12)) {
        return json({ error: "Ay 1 ile 12 arasında olmalı." }, 400);
      }
      if (gun !== null && (gun < 1 || gun > 31 || ay === null)) {
        return json({ error: "Gün için önce geçerli bir ay seç." }, 400);
      }
      if (!validTypes.includes(tur)) {
        return json({ error: "Geçersiz olay türü." }, 400);
      }

      const events = await readTimeline(supabase);
      const existingIndex = id
        ? events.findIndex((event) => event.id === id)
        : -1;

      if (id && existingIndex < 0) {
        return json({ error: "Düzenlenecek kayıt bulunamadı." }, 404);
      }

      const now = new Date().toISOString();
      const existing = existingIndex >= 0 ? events[existingIndex] : null;
      let medyaUrl = existing?.medya_url || null;
      let medyaTuru = existing?.medya_turu || null;
      let dosyaYolu = existing?.dosya_yolu || null;
      let uploadedPath: string | null = null;
      const removeMedia = String(form.get("medyayi_sil")) === "true";
      const externalUrl = String(form.get("medya_url") || "").trim();
      const requestedMediaType = String(form.get("medya_turu") || "");
      const file = form.get("file");

      if (removeMedia) {
        medyaUrl = null;
        medyaTuru = null;
        dosyaYolu = null;
      }

      if (externalUrl) {
        if (!/^https?:\/\//i.test(externalUrl)) {
          return json({ error: "Medya bağlantısı http:// veya https:// ile başlamalı." }, 400);
        }

        medyaUrl = externalUrl;
        medyaTuru = requestedMediaType === "video" ? "video" : "gorsel";
        dosyaYolu = null;
      }

      if (file instanceof File && file.size > 0) {
        if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/")
        ) {
          return json({ error: "Yalnızca görsel veya video yüklenebilir." }, 400);
        }

        if (file.size > MAX_TIMELAPSE_MEDIA_SIZE) {
          return json({ error: "Medya dosyası en fazla 18 MB olabilir. Büyük videolar için bağlantı kullan." }, 400);
        }

        await ensurePublicBucket(supabase, TIMELAPSE_BUCKET);
        uploadedPath = `media/${safeFilename(file.name)}`;

        const { error } = await supabase.storage
          .from(TIMELAPSE_BUCKET)
          .upload(uploadedPath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from(TIMELAPSE_BUCKET)
          .getPublicUrl(uploadedPath);

        medyaUrl = data.publicUrl;
        medyaTuru = file.type.startsWith("video/") ? "video" : "gorsel";
        dosyaYolu = uploadedPath;
      }

      const event: TimelineEvent = {
        id: existing?.id || crypto.randomUUID(),
        baslik,
        aciklama: String(form.get("aciklama") || "").trim() || null,
        tur: tur as TimelineEvent["tur"],
        yil,
        ay,
        gun,
        medya_url: medyaUrl,
        medya_turu: medyaTuru as TimelineEvent["medya_turu"],
        dosya_yolu: dosyaYolu,
        yayinlandi: String(form.get("yayinlandi")) === "true",
        created_at: existing?.created_at || now,
        updated_at: now,
      };

      if (existingIndex >= 0) events[existingIndex] = event;
      else events.push(event);

      try {
        await writeTimeline(supabase, events);
      } catch (error) {
        if (uploadedPath) {
          await supabase.storage.from(TIMELAPSE_BUCKET).remove([uploadedPath]);
        }
        throw error;
      }

      if (
        existing?.dosya_yolu &&
        existing.dosya_yolu !== event.dosya_yolu
      ) {
        await supabase.storage
          .from(TIMELAPSE_BUCKET)
          .remove([existing.dosya_yolu]);
      }

      return json({ event });
    }

    if (action === "timeline-toggle") {
      const events = await readTimeline(supabase);
      const event = events.find((item) => item.id === String(body.id || ""));

      if (!event) return json({ error: "Kayıt bulunamadı." }, 404);

      event.yayinlandi = Boolean(body.yayinlandi);
      event.updated_at = new Date().toISOString();
      await writeTimeline(supabase, events);

      return json({ ok: true });
    }

    if (action === "timeline-delete") {
      const events = await readTimeline(supabase);
      const index = events.findIndex(
        (item) => item.id === String(body.id || ""),
      );

      if (index < 0) return json({ error: "Kayıt bulunamadı." }, 404);

      const [event] = events.splice(index, 1);
      await writeTimeline(supabase, events);

      if (event.dosya_yolu) {
        await supabase.storage
          .from(TIMELAPSE_BUCKET)
          .remove([event.dosya_yolu]);
      }

      return json({ ok: true });
    }

    return json({ error: "Geçersiz işlem." }, 400);
  } catch (error) {
    console.error("tasarim-admin error", error);
    return json({ error: errorDetails(error) }, 500);
  }
});
