import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "tasarimlar";

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
    return {
      name: error.name,
      message: error.message,
    };
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
  const extension = filename.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";

  return `${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;
}

function storagePathFromUrl(url: string) {
  const marker = `/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);

  if (index < 0) return null;

  return decodeURIComponent(url.slice(index + marker.length));
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
    return json(
      { error: "ADMIN_PASSWORD secret tanımlanmamış." },
      500,
    );
  }

  if (!suppliedPassword || suppliedPassword !== adminPassword) {
    return json({ error: "Yönetim şifresi yanlış." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      { error: "Supabase servis değişkenleri bulunamadı." },
      500,
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
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
      if (!form) {
        return json({ error: "Yükleme formu alınamadı." }, 400);
      }

      const file = form.get("file");

      if (!(file instanceof File) || file.size === 0) {
        return json({ error: "Geçerli bir görsel seç." }, 400);
      }

      if (!file.type.startsWith("image/")) {
        return json({ error: "Yalnızca görsel dosyaları yüklenebilir." }, 400);
      }

      const { data: buckets, error: bucketListError } =
        await supabase.storage.listBuckets();

      if (bucketListError) throw bucketListError;

      const bucket = buckets?.find((item) => item.name === BUCKET);

      if (!bucket) {
        const { error: createBucketError } =
          await supabase.storage.createBucket(BUCKET, {
            public: true,
          });

        if (createBucketError) throw createBucketError;
      } else if (!bucket.public) {
        const { error: updateBucketError } =
          await supabase.storage.updateBucket(BUCKET, {
            public: true,
          });

        if (updateBucketError) throw updateBucketError;
      }

      const path = safeFilename(file.name);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      const row = {
        baslik: String(form.get("baslik") || "").trim() || null,
        kategori: String(form.get("kategori") || "").trim() || null,
        yil: form.get("yil")
          ? Number(form.get("yil"))
          : null,
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
        await supabase.storage.from(BUCKET).remove([path]);
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
        storagePathFromUrl(design.gorsel_url || "");

      if (path) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove([path]);

        if (removeError) throw removeError;
      }

      const { error: deleteError } = await supabase
        .from("tasarimlar")
        .delete()
        .eq("id", body.id);

      if (deleteError) throw deleteError;

      return json({ ok: true });
    }

    return json({ error: "Geçersiz işlem." }, 400);
  } catch (error) {
    console.error("tasarim-admin error", error);

    return json(
      {
        error: errorDetails(error),
      },
      500,
    );
  }
});
