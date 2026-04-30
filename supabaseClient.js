(function () {
  const buckets = {
    projectPhotos: "project-photos",
    brandAssets: "brand-assets",
    generatedVideos: "generated-videos"
  };

  let clientPromise = null;

  function env() {
    return window.ESTATEMOTION_ENV ?? {};
  }

  function enabled() {
    return !env().MOCK_SUPABASE;
  }

  async function client() {
    if (!enabled()) return null;
    if (!env().SUPABASE_URL || !env().SUPABASE_ANON_KEY) {
      const missing = [];
      if (!env().SUPABASE_URL) missing.push("SUPABASE_URL");
      if (!env().SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");
      throw new Error(`Supabase production mode is enabled, but ${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} missing. Add them in Vercel Environment Variables or set MOCK_SUPABASE=true for local demo mode.`);
    }
    if (!clientPromise) {
      clientPromise = import(env().SUPABASE_JS_URL || "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(({ createClient }) =>
        createClient(env().SUPABASE_URL, env().SUPABASE_ANON_KEY, {
          auth: {
            autoRefreshToken: true,
            detectSessionInUrl: true,
            persistSession: true
          }
        })
      );
    }
    return clientPromise;
  }

  async function getSession() {
    const supabase = await client();
    if (!supabase) return { session: null, user: null };
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session: data.session, user: data.session?.user ?? null };
  }

  async function signInWithEmail(email) {
    const supabase = await client();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/app/` }
    });
    if (error) throw error;
  }

  async function signInWithGoogle() {
    const supabase = await client();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app/` }
    });
    if (error) throw error;
  }

  async function signOut() {
    const supabase = await client();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function loadWorkspace(userId) {
    const supabase = await client();
    const [profileResult, brandResult, projectResult] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).maybeSingle(),
      supabase.from("brand_kits").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle()
    ]);
    throwIf(profileResult.error);
    throwIf(brandResult.error);
    throwIf(projectResult.error);

    let photos = [];
    let videos = [];
    if (projectResult.data?.id) {
      const [photosResult, videosResult] = await Promise.all([
        supabase.from("project_photos").select("*").eq("project_id", projectResult.data.id).order("sort_order", { ascending: true }),
        supabase.from("generated_videos").select("*").eq("project_id", projectResult.data.id).order("created_at", { ascending: false })
      ]);
      throwIf(photosResult.error);
      throwIf(videosResult.error);
      photos = photosResult.data ?? [];
      videos = videosResult.data ?? [];
    }

    return {
      user: profileResult.data,
      brandKit: mapBrandFromRow(brandResult.data),
      project: mapProjectFromRow(projectResult.data, photos),
      generatedVideos: videos
    };
  }

  async function saveWorkspace(snapshot, authUser) {
    const supabase = await client();
    if (!supabase || !authUser) return {};

    const profile = {
      id: authUser.id,
      email: authUser.email ?? snapshot.user.email,
      full_name: snapshot.user.name || snapshot.brandKit.name,
      subscription_status: snapshot.user.subscriptionStatus,
      credit_balance: snapshot.user.creditBalance
    };
    const profileResult = await supabase.from("users").upsert(profile).select().single();
    throwIf(profileResult.error);

    const brandPayload = mapBrandToRow(snapshot.brandKit, authUser.id);
    const brandResult = brandPayload.id
      ? await supabase.from("brand_kits").upsert(brandPayload).select().single()
      : await supabase.from("brand_kits").insert(brandPayload).select().single();
    throwIf(brandResult.error);

    const projectPayload = mapProjectToRow(snapshot.project, authUser.id, brandResult.data.id, snapshot.selectedTemplateId);
    const projectResult = projectPayload.id
      ? await supabase.from("projects").upsert(projectPayload).select().single()
      : await supabase.from("projects").insert(projectPayload).select().single();
    throwIf(projectResult.error);

    if (snapshot.project.photos?.length) {
      const rows = snapshot.project.photos.map((photo, index) => mapPhotoToRow(photo, projectResult.data.id, index));
      const photosResult = await supabase.from("project_photos").upsert(rows, { onConflict: "project_id,client_id" });
      throwIf(photosResult.error);
    }

    if (snapshot.renderQueue?.length) {
      const rows = snapshot.renderQueue.map((job) => mapVideoToRow(job, projectResult.data.id, snapshot.selectedTemplateId));
      const videosResult = await supabase.from("generated_videos").upsert(rows, { onConflict: "project_id,client_id" });
      throwIf(videosResult.error);
    }

    return {
      brandKitId: brandResult.data.id,
      projectId: projectResult.data.id
    };
  }

  async function uploadAsset(file, bucket, path) {
    const supabase = await client();
    const cleanPath = path.replace(/[^a-zA-Z0-9/._-]+/g, "-");
    const { data, error } = await supabase.storage.from(bucket).upload(cleanPath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "application/octet-stream"
    });
    if (error) throw error;
    const publicResult = supabase.storage.from(bucket).getPublicUrl(data.path);
    return {
      path: data.path,
      publicUrl: publicResult.data.publicUrl
    };
  }

  async function uploadTextAsset(name, content, contentType = "application/json") {
    const file = new Blob([content], { type: contentType });
    const session = await getSession();
    if (!session.user) throw new Error("Sign in before uploading generated assets.");
    return uploadAsset(file, buckets.generatedVideos, `${session.user.id}/generated/${Date.now()}-${name}`);
  }

  function throwIf(error) {
    if (error) throw error;
  }

  function mapBrandToRow(brandKit, userId) {
    return {
      id: brandKit.id || undefined,
      user_id: userId,
      name: brandKit.name,
      brokerage: brandKit.brokerage,
      headshot_path: brandKit.headshotPath || "",
      logo_path: brandKit.logoPath || "",
      headshot_url: brandKit.headshotUri || "",
      logo_url: brandKit.logoUri || "",
      phone: brandKit.phone,
      email: brandKit.email,
      website: brandKit.website,
      instagram_handle: brandKit.instagram,
      primary_color: brandKit.primaryColor,
      accent_color: brandKit.accentColor,
      cta_text: brandKit.ctaText,
      compliance_enabled: brandKit.complianceEnabled,
      listing_courtesy_of: brandKit.listingCourtesyOf,
      brokerage_disclaimer: brandKit.brokerageDisclaimer,
      equal_housing: brandKit.equalHousing,
      mls_disclaimer: brandKit.mlsDisclaimer
    };
  }

  function mapBrandFromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name || "",
      brokerage: row.brokerage || "",
      headshotPath: row.headshot_path || "",
      logoPath: row.logo_path || "",
      headshotUri: row.headshot_url || "",
      logoUri: row.logo_url || "",
      phone: row.phone || "",
      email: row.email || "",
      website: row.website || "",
      instagram: row.instagram_handle || "",
      primaryColor: row.primary_color || "#111111",
      accentColor: row.accent_color || "#C7A76C",
      ctaText: row.cta_text || "Book a private tour",
      complianceEnabled: row.compliance_enabled ?? true,
      listingCourtesyOf: row.listing_courtesy_of || "",
      brokerageDisclaimer: row.brokerage_disclaimer || "",
      equalHousing: row.equal_housing ?? true,
      mlsDisclaimer: row.mls_disclaimer || ""
    };
  }

  function mapProjectToRow(project, userId, brandKitId, templateId) {
    return {
      id: project.id || undefined,
      user_id: userId,
      brand_kit_id: brandKitId,
      template_id: templateId,
      title: project.title,
      property_address: project.address,
      price: project.price,
      beds: parseNumber(project.beds),
      baths: parseNumber(project.baths),
      square_feet: parseInt(project.squareFeet, 10) || null,
      neighborhood: project.neighborhood,
      city: project.city,
      listing_type: project.listingType,
      hook_text: project.hookText,
      caption: project.caption,
      cta: project.cta,
      hook_preset: project.hookPreset,
      caption_tone: project.captionTone,
      reel_theme: project.reelTheme,
      text_animation: project.textAnimation,
      music_mood: project.musicMood,
      outro_variation: project.outroVariation,
      thumbnail_preset: project.thumbnailPreset,
      reel_variations: project.reelVariations ?? [],
      branding_visible: project.brandingVisible,
      authenticity_mode: project.authenticityMode,
      local_agent_mode: project.localAgentMode,
      status: "draft"
    };
  }

  function mapProjectFromRow(row, photos) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title || "",
      address: row.property_address || "",
      price: row.price || "",
      beds: row.beds?.toString() || "",
      baths: row.baths?.toString() || "",
      squareFeet: row.square_feet?.toString() || "",
      neighborhood: row.neighborhood || "",
      city: row.city || "",
      listingType: row.listing_type || "Just Listed",
      hookText: row.hook_text || "",
      caption: row.caption || "",
      cta: row.cta || "",
      hookPreset: row.hook_preset || "Luxury",
      captionTone: row.caption_tone || "Luxury",
      reelTheme: row.reel_theme || "scottsdale-desert-luxury",
      textAnimation: row.text_animation || "Luxury minimal",
      musicMood: row.music_mood || "Luxury",
      outroVariation: row.outro_variation || "Headshot + CTA",
      thumbnailPreset: row.thumbnail_preset || "Inside This Home",
      reelVariations: row.reel_variations || [],
      brandingVisible: row.branding_visible ?? true,
      authenticityMode: row.authenticity_mode ?? true,
      localAgentMode: row.local_agent_mode ?? true,
      photos: photos.map(mapPhotoFromRow)
    };
  }

  function mapPhotoToRow(photo, projectId, index) {
    return {
      project_id: projectId,
      client_id: photo.id,
      storage_path: photo.storagePath || photo.uri,
      public_url: photo.uri,
      file_name: photo.fileName,
      category: photo.category,
      sort_order: index + 1,
      file_size: photo.size || null
    };
  }

  function mapPhotoFromRow(row) {
    return {
      id: row.client_id || row.id,
      uri: row.public_url || row.storage_path,
      storagePath: row.storage_path,
      fileName: row.file_name,
      size: row.file_size || 0,
      category: row.category,
      order: row.sort_order
    };
  }

  function mapVideoToRow(job, projectId, templateId) {
    return {
      project_id: projectId,
      client_id: job.id,
      template_id: templateId,
      format: job.format,
      content_pack_type: job.packId,
      status: job.status,
      output_path: job.outputPath || "",
      render_metadata: job
    };
  }

  function parseNumber(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  window.EstateMotionSupabase = {
    buckets,
    enabled,
    client,
    getSession,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    loadWorkspace,
    saveWorkspace,
    uploadAsset,
    uploadTextAsset
  };
})();
