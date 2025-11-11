import supabase, { supabaseUrl } from './supabase';

export async function getUrls(user_id) {
  const { data, error } = await supabase.from("urls").select("*")
    .eq("user_id", user_id);
  if (error) {
    console.error(error.message);
    throw new Error("Không thể tải về các đường link");
  }
  return data
}

export async function deleteUrl(id) {
  // Delete clicks associated with this URL
  const { error: clicksError } = await supabase.from("clicks").delete().eq("url_id", id);
  if (clicksError) {
    console.error(clicksError.message);
    throw new Error("Không thể xoá các click liên quan");
  }

  // Delete bio_urls associated with this URL
  const { error: bioUrlsError } = await supabase.from("bio_urls").delete().eq("url_id", id);
  if (bioUrlsError) {
    console.error(bioUrlsError.message);
    throw new Error("Không thể xoá các bio_urls liên quan");
  }

  // Fetch the URL record to get the QR code file name
  const { data: urlData, error: fetchError } = await supabase.from("urls").select("short_url").eq("id", id).single();
  if (fetchError) {
    console.error(fetchError.message);
    throw new Error("Không thể tìm thấy đường link để xoá");
  }

  // Extract the file name from short_url
  const fileName = `qr-${urlData.short_url}`;

  // Delete the QR code file from the "qrs" storage bucket
  const { error: storageError } = await supabase.storage.from("qrs").remove([fileName]);
  if (storageError) {
    console.error(storageError.message);
    throw new Error("Không thể xoá mã QR khỏi bộ nhớ");
  }

  const { data, error } = await supabase.from("urls").delete()
    .eq("id", id);
  if (error) {
    console.error(error.message);
    throw new Error("Không thể xoá đường link");
  }
  return data
}

async function checkIfShortUrlExists(short_url) {
  const { data, error } = await supabase.from("urls").select("short_url").eq("short_url", short_url);
  if (error) {
    console.error("Error checking short_url existence:", error);
    return false;
  }
  return data && data.length > 0;
}

// Step 1: Create URL record first (qr_code may be null initially)
export async function createUrl(options, qrcode = null, expirationTime = null, captchaToken = null) {
  const { title, longUrl, customUrl, user_id, isTemporary } = options;
  if (captchaToken) {
    console.log("CAPTCHA token received:", captchaToken);
  }

  let short_url;
  do {
    short_url = Math.random().toString(36).substr(2, 6);
  } while (await checkIfShortUrlExists(short_url));

  // If a QR file is provided (legacy path), upload immediately; otherwise leave null
  let qr_code = null;
  if (qrcode) {
    const fileName = `qr-${short_url}`;
    console.log("Uploading QR code file (legacy immediate upload):", fileName, qrcode);
    const { error: storageError } = await supabase.storage
      .from("qrs")
      .upload(fileName, qrcode);
    if (storageError) {
      console.error("Storage upload error:", storageError);
      throw new Error(storageError.message);
    }
    qr_code = `${supabaseUrl}/storage/v1/object/public/qrs/${fileName}`;
  }

  const { data, error } = await supabase
    .from("urls")
    .insert([
      {
        title,
        user_id,
        original_url: longUrl,
        custom_url: customUrl || null,
        short_url,
        qr_code, // may be null (new flow) or populated (legacy)
        expiration_time: expirationTime || null,
        is_temporary: isTemporary || false,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Không thể tạo đường link");
  }

  return data;
}

// Step 2: After short_url is known on client, generate QR and attach
export async function attachQrCode(options, qrcodeFile) {
  const { id, short_url } = options;
  if (!id || !short_url) throw new Error("Thiếu id hoặc short_url để gắn QR");
  if (!qrcodeFile) throw new Error("Không có file QR để tải lên");

  const fileName = `qr-${short_url}`;
  // Remove old file if exists (idempotent update)
  try {
    await supabase.storage.from("qrs").remove([fileName]);
  } catch (e) {
    // ignore delete errors
  }

  const { error: storageError } = await supabase.storage.from("qrs").upload(fileName, qrcodeFile);
  if (storageError) {
    console.error(storageError.message);
    throw new Error("Không thể tải lên mã QR");
  }
  const qr_code = `${supabaseUrl}/storage/v1/object/public/qrs/${fileName}`;
  const { data, error } = await supabase.from("urls").update({ qr_code }).eq("id", id).select();
  if (error) {
    console.error(error.message);
    throw new Error("Không thể cập nhật mã QR cho đường link");
  }
  return data;
}

export async function getLongUrl(identifier) {
  console.log(`Looking up URL by ID: ${identifier}`);
  // Always treat the identifier as a numeric ID and use exact matching
  const { data, error } = await supabase.from("urls")
    .select("id, original_url, custom_url, short_url, created_at")
    .eq("id", parseInt(identifier))
    .single();

  if (error) {
    console.error("Error fetching URL by ID:", error.message);
    throw new Error("Không thấy đường link");
  }

  if (!data) {
    throw new Error("Không thấy đường link");
  }

  console.log(`Found URL by ID:`, data);
  return data;
}

// New: lookup by short_url for single-segment redirects like /{short_url}
export async function getLongUrlByShort(shortUrl) {
  console.log(`Looking up URL by short code: ${shortUrl}`);
  const { data, error } = await supabase
    .from("urls")
    .select("id, original_url, custom_url, short_url, created_at")
    .eq("short_url", shortUrl)
    .single();

  if (error) {
    console.error("Error fetching URL by short_url:", error.message);
    throw new Error("Không thấy đường link");
  }

  if (!data) {
    throw new Error("Không thấy đường link");
  }

  return data;
}

// New: lookup by id AND custom_url for two-segment redirects like /{id}/{custom_url}
export async function getLongUrlByIdAndCustom({ id, customUrl }) {
  console.log(`Looking up URL by ID and custom: id=${id}, custom=${customUrl}`);
  const { data, error } = await supabase
    .from("urls")
    .select("id, original_url, custom_url, short_url, created_at")
    .eq("id", parseInt(id))
    .eq("custom_url", customUrl)
    .single();

  if (error) {
    console.error("Error fetching URL by id and custom_url:", error.message);
    throw new Error("Không thấy đường link");
  }

  if (!data) {
    throw new Error("Không thấy đường link");
  }

  return data;
}

export async function getUrl({id,user_id}) {
  const { data, error } = await supabase.from("urls").select("*")
  .eq("id", id).eq("user_id", user_id)
  .single()
  if (error) {
    console.error(error.message);
    throw new Error("Không tìm thấy đường link");
  }
  return data
}

export async function checkCustomUrlExists(customUrl, user_id) {
  const { data, error } = await supabase.from("urls").select("custom_url").eq("custom_url", customUrl).eq("user_id", user_id);
  if (error) {
    console.error(error.message);
    throw new Error("Không thể kiểm tra đường link tùy chỉnh");
  }
  return data && data.length > 0;
}

export async function checkTitleExists(title, user_id) {
  const { data, error } = await supabase.from("urls").select("title").eq("title", title).eq("user_id", user_id);
  if (error) {
    console.error(error.message);
    throw new Error("Không thể kiểm tra tiêu đề");
  }
  return data && data.length > 0;
}

export async function updateUrl(options, updates, newProfilePic = null) {
  const { id, user_id } = options;
  // First, get the current URL to check user_id and get current data
  const { data: currentUrl, error: fetchError } = await supabase.from("urls").select("user_id, title, custom_url, profile_pic").eq("id", id).single();
  if (fetchError) {
    console.error(fetchError.message);
    throw new Error("Không thể tìm thấy đường link để cập nhật");
  }
  if (currentUrl.user_id !== user_id) {
    throw new Error("Không có quyền cập nhật đường link này");
  }

  // Check for duplicate title (per user)
  if (updates.title && updates.title !== currentUrl.title) {
    const titleExists = await checkTitleExists(updates.title, user_id);
    if (titleExists) {
      throw new Error("Tiêu đề này đã được bạn sử dụng. Vui lòng chọn tiêu đề khác.");
    }
  }

  // Check for duplicate customUrl (per user)
  if (updates.customUrl !== undefined && updates.customUrl !== currentUrl.custom_url) {
    if (updates.customUrl) {
      const customExists = await checkCustomUrlExists(updates.customUrl, user_id);
      if (customExists) {
        throw new Error("Link tuỳ chỉnh này đã được bạn sử dụng. Vui lòng chọn tên khác.");
      }
    }
  }

  // Prepare updates
  const dbUpdates = { ...updates };

  // Handle profile pic removal
  if (dbUpdates.profile_pic === null && currentUrl.profile_pic) {
    const oldFileName = currentUrl.profile_pic.split('/').pop();
    const { error: deleteError } = await supabase.storage.from("url_profile_pic").remove([oldFileName]);
    if (deleteError) {
      console.error(deleteError.message);
      // Don't throw, continue with update
    }
  }

  // Handle profile pic update
  if (newProfilePic) {
    // Delete old profile pic if exists
    if (currentUrl.profile_pic) {
      const oldFileName = currentUrl.profile_pic.split('/').pop();
      const { error: deleteError } = await supabase.storage.from("url_profile_pic").remove([oldFileName]);
      if (deleteError) {
        console.error(deleteError.message);
        // Don't throw, continue with update
      }
    }

    // Upload new profile pic
    const fileName = `profile-${id}.png`;
    const { error: storageError } = await supabase.storage
      .from("url_profile_pic")
      .upload(fileName, newProfilePic);

    if (storageError) {
      console.error("Storage upload error:", storageError);
      throw new Error("Không thể tải lên ảnh đại diện mới");
    }

    dbUpdates.profile_pic = `${supabaseUrl}/storage/v1/object/public/url_profile_pic/${fileName}`;
  }

  // Map customUrl to custom_url for database consistency
  if (dbUpdates.customUrl !== undefined) {
    dbUpdates.custom_url = dbUpdates.customUrl || null;
    delete dbUpdates.customUrl;
  }

  const { data, error } = await supabase.from("urls").update(dbUpdates).eq("id", id);
  if (error) {
    console.error(error.message);
    throw new Error("Không thể cập nhật đường link");
  }
  return data;
}
