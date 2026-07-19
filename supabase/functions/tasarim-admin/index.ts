import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DESIGN_BUCKET = "tasarimlar";
const OFFICIAL_DESIGNS_INDEX = "resmi-tasarimlar.json";
const TIMELAPSE_BUCKET = "timelapse";
const TIMELAPSE_INDEX = "events.json";
const PROJECTS_INDEX = "projects.json";
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

type ProjectStep = {
  id: string;
  baslik: string;
  aciklama: string | null;
  medya_url: string | null;
  dosya_yolu: string | null;
};

type PortfolioProject = {
  id: string;
  slug: string;
  baslik: string;
  kategori: string | null;
  yil: number | null;
  ozet: string | null;
  aciklama: string | null;
  rol: string | null;
  araclar: string[];
  banner_url: string | null;
  banner_yolu: string | null;
  once_url: string | null;
  once_yolu: string | null;
  sonra_url: string | null;
  sonra_yolu: string | null;
  adimlar: ProjectStep[];
  sira: number;
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

function sortProjects(projects: PortfolioProject[]) {
  return [...projects].sort((a, b) =>
    a.sira - b.sira || b.created_at.localeCompare(a.created_at)
  );
}

function missingStorageObject(error: unknown) {
  const details = errorDetails(error);
  const message = String(details.message || "").toLowerCase();
  const status = String(details.statusCode || details.code || "");

  return status === "404" || message.includes("not found") || message.includes("does not exist");
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

async function readProjects(supabase: SupabaseClient): Promise<PortfolioProject[]> {
  const { data, error } = await supabase.storage
    .from(TIMELAPSE_BUCKET)
    .download(PROJECTS_INDEX);

  if (error) {
    if (missingStorageObject(error)) return [];
    throw error;
  }

  const content = await data.text();
  if (!content.trim()) return [];
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeProjects(
  supabase: SupabaseClient,
  projects: PortfolioProject[],
) {
  await ensurePublicBucket(supabase, TIMELAPSE_BUCKET);
  const content = new Blob([JSON.stringify(sortProjects(projects), null, 2)], {
    type: "application/json",
  });

  const { error } = await supabase.storage
    .from(TIMELAPSE_BUCKET)
    .upload(PROJECTS_INDEX, content, {
      contentType: "application/json; charset=utf-8",
      cacheControl: "0",
      upsert: true,
    });

  if (error) throw error;
}

async function uploadProjectMedia(
  supabase: SupabaseClient,
  file: File,
  projectId: string,
) {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    throw new Error("Proje medyası yalnızca görsel veya video olabilir.");
  }
  if (file.size > MAX_TIMELAPSE_MEDIA_SIZE) {
    throw new Error("Her proje dosyası en fazla 18 MB olabilir.");
  }

  await ensurePublicBucket(supabase, TIMELAPSE_BUCKET);
  const path = `projects/${projectId}/${safeFilename(file.name)}`;
  const { error } = await supabase.storage
    .from(TIMELAPSE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(TIMELAPSE_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

async function readOfficialDesignIds(
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(TIMELAPSE_BUCKET)
    .download(OFFICIAL_DESIGNS_INDEX);

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

  const parsed = JSON.parse(await data.text());
  return Array.isArray(parsed) ? parsed.map(String) : [];
}

async function writeOfficialDesignIds(
  supabase: SupabaseClient,
  ids: string[],
) {
  await ensurePublicBucket(supabase, TIMELAPSE_BUCKET);

  const uniqueIds = [...new Set(ids.map(String))];
  const content = new Blob([JSON.stringify(uniqueIds, null, 2)], {
    type: "application/json",
  });

  const { error } = await supabase.storage
    .from(TIMELAPSE_BUCKET)
    .upload(OFFICIAL_DESIGNS_INDEX, content, {
      contentType: "application/json; charset=utf-8",
      cacheControl: "0",
      upsert: true,
    });

  if (error) throw error;
}

async function setOfficialDesign(
  supabase: SupabaseClient,
  id: string | number,
  official: boolean,
) {
  const designId = String(id);
  const ids = await readOfficialDesignIds(supabase);
  const nextIds = official
    ? [...ids, designId]
    : ids.filter((item) => String(item) !== designId);

  await writeOfficialDesignIds(supabase, nextIds);
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
      const officialIds = new Set(await readOfficialDesignIds(supabase));
      const designs = (data || []).map((design) => ({
        ...design,
        resmi_tasarim: officialIds.has(String(design.id)),
      }));

      return json({ designs });
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

      await setOfficialDesign(
        supabase,
        data.id,
        String(form.get("resmi_tasarim")) === "true",
      );

      return json({
        design: {
          ...data,
          resmi_tasarim:
            String(form.get("resmi_tasarim")) === "true",
        },
      });
    }

    if (action === "update") {
      if (!form) return json({ error: "Düzenleme formu alınamadı." }, 400);

      const id = String(form.get("id") || "").trim();
      if (!id) return json({ error: "Tasarım kimliği bulunamadı." }, 400);

      const { data: existing, error: findError } = await supabase
        .from("tasarimlar")
        .select("*")
        .eq("id", id)
        .single();

      if (findError) throw findError;

      const file = form.get("file");
      let nextPath = existing.dosya_yolu || null;
      let nextUrl = existing.gorsel_url;
      let uploadedPath: string | null = null;

      if (file instanceof File && file.size > 0) {
        if (!file.type.startsWith("image/")) {
          return json({ error: "Yalnızca görsel dosyaları yüklenebilir." }, 400);
        }

        await ensurePublicBucket(supabase, DESIGN_BUCKET);
        uploadedPath = safeFilename(file.name);
        const { error: uploadError } = await supabase.storage
          .from(DESIGN_BUCKET)
          .upload(uploadedPath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(DESIGN_BUCKET)
          .getPublicUrl(uploadedPath);

        nextPath = uploadedPath;
        nextUrl = publicUrlData.publicUrl;
      }

      const updates = {
        baslik: String(form.get("baslik") || "").trim() || null,
        kategori: String(form.get("kategori") || "").trim() || null,
        yil: form.get("yil") ? Number(form.get("yil")) : null,
        aciklama: String(form.get("aciklama") || "").trim() || null,
        sira: Number(form.get("sira") || 0),
        yayinlandi: String(form.get("yayinlandi")) === "true",
        gorsel_url: nextUrl,
        dosya_yolu: nextPath,
      };

      const { data, error: updateError } = await supabase
        .from("tasarimlar")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        if (uploadedPath) {
          await supabase.storage.from(DESIGN_BUCKET).remove([uploadedPath]);
        }
        throw updateError;
      }

      const oldPath =
        existing.dosya_yolu ||
        storagePathFromUrl(existing.gorsel_url || "", DESIGN_BUCKET);

      if (uploadedPath && oldPath && oldPath !== uploadedPath) {
        await supabase.storage.from(DESIGN_BUCKET).remove([oldPath]);
      }

      const official = String(form.get("resmi_tasarim")) === "true";
      await setOfficialDesign(supabase, id, official);
      return json({ design: { ...data, resmi_tasarim: official } });
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
      await setOfficialDesign(supabase, String(body.id), false);
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

    if (action === "project-list") {
      return json({ projects: sortProjects(await readProjects(supabase)) });
    }

    if (action === "project-save") {
      if (!form) return json({ error: "Proje formu alınamadı." }, 400);

      const projects = await readProjects(supabase);
      const requestedId = String(form.get("id") || "").trim();
      const existingIndex = requestedId
        ? projects.findIndex((project) => project.id === requestedId)
        : -1;
      if (requestedId && existingIndex < 0) {
        return json({ error: "Düzenlenecek proje bulunamadı." }, 404);
      }

      const existing = existingIndex >= 0 ? projects[existingIndex] : null;
      const id = existing?.id || crypto.randomUUID();
      const baslik = String(form.get("baslik") || "").trim();
      const slug = String(form.get("slug") || "").trim().toLowerCase();
      if (!baslik) return json({ error: "Proje başlığı zorunlu." }, 400);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return json({ error: "Adres yalnızca küçük harf, rakam ve tire içerebilir." }, 400);
      }
      if (projects.some((project) => project.slug === slug && project.id !== id)) {
        return json({ error: "Bu proje adresi zaten kullanılıyor." }, 409);
      }

      let requestedSteps: Array<Record<string, unknown>> = [];
      try {
        const parsed = JSON.parse(String(form.get("adimlar") || "[]"));
        requestedSteps = Array.isArray(parsed) ? parsed : [];
      } catch {
        return json({ error: "Nasıl yaptım adımları okunamadı." }, 400);
      }

      const uploadedPaths: string[] = [];
      const oldPathsToRemove: string[] = [];
      let bannerUrl = existing?.banner_url || null;
      let bannerPath = existing?.banner_yolu || null;
      let beforeUrl = existing?.once_url || null;
      let beforePath = existing?.once_yolu || null;
      let afterUrl = existing?.sonra_url || null;
      let afterPath = existing?.sonra_yolu || null;

      const replaceMedia = async (
        key: "banner" | "once" | "sonra",
        currentPath: string | null,
        remove: boolean,
      ) => {
        const entry = form!.get(key);
        if (entry instanceof File && entry.size > 0) {
          const uploaded = await uploadProjectMedia(supabase, entry, id);
          uploadedPaths.push(uploaded.path);
          if (currentPath) oldPathsToRemove.push(currentPath);
          return uploaded;
        }
        if (remove) {
          if (currentPath) oldPathsToRemove.push(currentPath);
          return { path: null, url: null };
        }
        return null;
      };

      try {
        const banner = await replaceMedia("banner", bannerPath, false);
        if (banner) { bannerPath = banner.path; bannerUrl = banner.url; }
        const before = await replaceMedia("once", beforePath, String(form.get("once_sil")) === "true");
        if (before) { beforePath = before.path; beforeUrl = before.url; }
        const after = await replaceMedia("sonra", afterPath, String(form.get("sonra_sil")) === "true");
        if (after) { afterPath = after.path; afterUrl = after.url; }

        const oldSteps = new Map((existing?.adimlar || []).map((step) => [step.id, step]));
        const nextSteps: ProjectStep[] = [];

        for (let index = 0; index < requestedSteps.length; index += 1) {
          const requested = requestedSteps[index];
          const stepId = String(requested.id || crypto.randomUUID());
          const oldStep = oldSteps.get(stepId);
          let mediaUrl = oldStep?.medya_url || null;
          let mediaPath = oldStep?.dosya_yolu || null;
          const externalUrl = String(requested.medya_url || "").trim();
          const stepFile = form.get(`adim_dosya_${index}`);

          if (externalUrl) {
            if (!/^https?:\/\//i.test(externalUrl)) {
              throw new Error("Adım medya bağlantıları http:// veya https:// ile başlamalı.");
            }
            if (mediaPath) oldPathsToRemove.push(mediaPath);
            mediaPath = null;
            mediaUrl = externalUrl;
          }

          if (stepFile instanceof File && stepFile.size > 0) {
            const uploaded = await uploadProjectMedia(supabase, stepFile, id);
            uploadedPaths.push(uploaded.path);
            if (mediaPath) oldPathsToRemove.push(mediaPath);
            mediaPath = uploaded.path;
            mediaUrl = uploaded.url;
          }

          nextSteps.push({
            id: stepId,
            baslik: String(requested.baslik || "").trim() || `Adım ${index + 1}`,
            aciklama: String(requested.aciklama || "").trim() || null,
            medya_url: mediaUrl,
            dosya_yolu: mediaPath,
          });
          oldSteps.delete(stepId);
        }

        oldSteps.forEach((step) => {
          if (step.dosya_yolu) oldPathsToRemove.push(step.dosya_yolu);
        });

        if (String(form.get("yayinlandi")) === "true" && !bannerUrl) {
          throw new Error("Yayınlanan projede banner görseli zorunlu.");
        }

        const now = new Date().toISOString();
        const project: PortfolioProject = {
          id,
          slug,
          baslik,
          kategori: String(form.get("kategori") || "").trim() || null,
          yil: numberOrNull(form.get("yil")),
          ozet: String(form.get("ozet") || "").trim() || null,
          aciklama: String(form.get("aciklama") || "").trim() || null,
          rol: String(form.get("rol") || "").trim() || null,
          araclar: String(form.get("araclar") || "").split(",").map((item) => item.trim()).filter(Boolean),
          banner_url: bannerUrl,
          banner_yolu: bannerPath,
          once_url: beforeUrl,
          once_yolu: beforePath,
          sonra_url: afterUrl,
          sonra_yolu: afterPath,
          adimlar: nextSteps,
          sira: Number(form.get("sira") || 0),
          yayinlandi: String(form.get("yayinlandi")) === "true",
          created_at: existing?.created_at || now,
          updated_at: now,
        };

        if (existingIndex >= 0) projects[existingIndex] = project;
        else projects.push(project);
        await writeProjects(supabase, projects);

        if (oldPathsToRemove.length) {
          await supabase.storage.from(TIMELAPSE_BUCKET).remove([...new Set(oldPathsToRemove)]);
        }
        return json({ project });
      } catch (error) {
        if (uploadedPaths.length) {
          await supabase.storage.from(TIMELAPSE_BUCKET).remove(uploadedPaths);
        }
        throw error;
      }
    }

    if (action === "project-toggle") {
      const projects = await readProjects(supabase);
      const project = projects.find((item) => item.id === String(body.id || ""));
      if (!project) return json({ error: "Proje bulunamadı." }, 404);
      if (Boolean(body.yayinlandi) && !project.banner_url) {
        return json({ error: "Yayınlamak için önce banner ekle." }, 400);
      }
      project.yayinlandi = Boolean(body.yayinlandi);
      project.updated_at = new Date().toISOString();
      await writeProjects(supabase, projects);
      return json({ ok: true });
    }

    if (action === "project-delete") {
      const projects = await readProjects(supabase);
      const index = projects.findIndex((item) => item.id === String(body.id || ""));
      if (index < 0) return json({ error: "Proje bulunamadı." }, 404);
      const [project] = projects.splice(index, 1);
      await writeProjects(supabase, projects);
      const paths = [
        project.banner_yolu,
        project.once_yolu,
        project.sonra_yolu,
        ...project.adimlar.map((step) => step.dosya_yolu),
      ].filter((path): path is string => Boolean(path));
      if (paths.length) await supabase.storage.from(TIMELAPSE_BUCKET).remove(paths);
      return json({ ok: true });
    }

    return json({ error: "Geçersiz işlem." }, 400);
  } catch (error) {
    console.error("tasarim-admin error", error);
    return json({ error: errorDetails(error) }, 500);
  }
});
