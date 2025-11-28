import supabase, { supabaseUrl } from './supabase';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/tebiActions';
import { compressImage } from '@/lib/utils';

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
  const { data: urlData, error: fetchError } = await supabase.from("urls").select("short_url, qr_code").eq("id", id).single();
  if (fetchError) {
    console.error(fetchError.message);
    throw new Error("Không thể tìm thấy đường link để xoá");
  }
  // If there is a qr_code URL stored, extract the filename and remove it
  if (urlData && urlData.qr_code) {
    try {
      const prevFileName = urlData.qr_code.split('/').pop();
      if (prevFileName) {
        const { error: storageError } = await supabase.storage.from("qrs").remove([prevFileName]);
        if (storageError) {
          console.error(storageError.message);
          // Continue; best-effort removal but don't block deletion of DB record
        }
      }
    } catch (e) {
      console.error('Error removing previous QR file during deleteUrl:', e);
    }
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
    // Compress QR to target ~10KB before upload and choose extension from blob type
    let toUpload = qrcode;
    try {
      toUpload = await compressImage(qrcode, 10 * 1024, 600);
    } catch (e) {
      console.warn('QR compression failed (legacy upload), uploading original', e);
      toUpload = qrcode;
    }
    const ext = (toUpload && toUpload.type) ? (toUpload.type.split('/')[1] || 'png') : 'png';
    const fileName = `qr-${short_url}-${Date.now()}.${ext.replace('jpeg','jpg')}`;
    console.log("Uploading QR code file (legacy immediate upload):", fileName);
    const { error: storageError } = await supabase.storage
      .from("qrs")
      .upload(fileName, toUpload);
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
  // Fetch current record to determine if previous QR exists (so we can remove the exact file)
  try {
    const { data: current, error: fetchErr } = await supabase.from('urls').select('qr_code').eq('id', id).single();
    if (!fetchErr && current && current.qr_code) {
      const prevFile = current.qr_code.split('/').pop();
      if (prevFile) {
        try {
          // Remove previous QR from Tebi.io
          const bucket = 'qrs';
          await deleteFile(bucket, prevFile);
        } catch (e) {
          // ignore remove errors, proceed to upload new
        }
      }
    }
  } catch (e) {
    // ignore fetch errors and continue
  }

  // Compress QR to target ~10KB before upload, then choose extension based on blob type
  let toUpload = qrcodeFile;
  try {
    toUpload = await compressImage(qrcodeFile, 10 * 1024, 600);
  } catch (e) {
    console.warn('QR compression failed, uploading original', e);
    toUpload = qrcodeFile;
  }
  const ext = (toUpload && toUpload.type) ? (toUpload.type.split('/')[1] || 'png') : 'png';
  const fileName = `qr-${short_url}-${Date.now()}.${ext.replace('jpeg','jpg')}`;
  // Ensure toUpload is a Uint8Array for S3 upload compatibility
  if (!(toUpload instanceof Uint8Array)) {
    if (toUpload instanceof Blob || toUpload instanceof File) {
      const arrayBuffer = await toUpload.arrayBuffer();
      toUpload = new Uint8Array(arrayBuffer);
    } else {
      toUpload = new Uint8Array(toUpload);
    }
  }
  // Upload to Tebi.io
  const bucket = 'qrs';
  let uploadError = null;
  try {
    await uploadFile(bucket, toUpload, fileName);
  } catch (err) {
    uploadError = err;
  }
  if (uploadError) {
    console.error(uploadError.message);
    throw new Error('Không thể tải lên mã QR');
  }
  // Get public URL from Tebi.io
  const qr_code = getPublicUrl(bucket, fileName);
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

export async function getUrl({id, short_url, user_id}) {
  let query = supabase.from("urls").select("*");
  if (id) {
    query = query.eq("id", id);
  } else if (short_url) {
    query = query.eq("short_url", short_url);
  }
  if (user_id) {
    query = query.eq("user_id", user_id);
  }
  const { data, error } = await query.single();
  if (error) {
    console.error(error.message);
    throw new Error("Không tìm thấy đường link");
  }
  return data;
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

  // Handle profile pic removal (delete from Tebi.io via backend)
  if (dbUpdates.profile_pic === null && currentUrl.profile_pic) {
    const oldFileName = currentUrl.profile_pic.split('/').pop();
    try {
      const response = await fetch(`https://url-shortener-backend.fegeltronics.workers.dev/api/delete-qr`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify({ bucket: 'urlprofilepic', key: oldFileName })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xoá ảnh đại diện khỏi bộ nhớ');
      }
    } catch (e) {
      console.error('Error removing URL profile pic from Tebi.io (backend):', e.message || e);
      // Don't throw, continue with update
    }
  }

  // Handle profile pic update (upload to Tebi.io via AWS SDK)
  if (newProfilePic) {
    // Delete old profile pic if exists
    if (currentUrl.profile_pic) {
      const oldFileName = currentUrl.profile_pic.split('/').pop();
      try {
        const response = await fetch(`https://url-shortener-backend.fegeltronics.workers.dev/api/delete-qr`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
          },
          body: JSON.stringify({ bucket: 'urlprofilepic', key: oldFileName })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Không thể xoá ảnh đại diện khỏi bộ nhớ');
        }
      } catch (e) {
        // Don't throw, continue with update
      }
    }
    // Compress profile image to ~20KB before upload
    let toUpload = newProfilePic;
    try {
      toUpload = await compressImage(newProfilePic, 20 * 1024, 800);
    } catch (e) {
      console.warn('Profile pic compression failed, uploading original', e);
      toUpload = newProfilePic;
    }
    // Convert to Uint8Array for AWS SDK
    if (!(toUpload instanceof Uint8Array)) {
      if (toUpload instanceof Blob || toUpload instanceof File) {
        const arrayBuffer = await toUpload.arrayBuffer();
        toUpload = new Uint8Array(arrayBuffer);
      } else {
        toUpload = new Uint8Array(toUpload);
      }
    }
    // Upload new profile pic to Tebi.io using AWS SDK
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: 'us-east-1',
      endpoint: 'https://s3.tebi.io',
      credentials: {
        accessKeyId: import.meta.env.VITE_TEBI_ACCESS_KEY,
        secretAccessKey: import.meta.env.VITE_TEBI_SECRET_KEY,
      },
    });
    const fileName = `profile-${id}-${Date.now()}.png`;
    let uploadedUrl = null;
    try {
      await s3.send(new PutObjectCommand({
        Bucket: 'urlprofilepic',
        Key: fileName,
        Body: toUpload,
        ContentType: newProfilePic.type || 'image/png',
      }));
      uploadedUrl = `https://s3.tebi.io/urlprofilepic/${fileName}`;
    } catch (err) {
      throw new Error('Không thể tải lên ảnh đại diện mới: ' + err.message);
    }
    dbUpdates.profile_pic = uploadedUrl;
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

// Remove QR code file and clear `qr_code` column for a URL
export async function deleteQrCode({ id } = {}) {
  if (!id) throw new Error("Thiếu id để xoá QR");

  // Fetch current record to get exact filename
  const { data: current, error: fetchErr } = await supabase.from('urls').select('qr_code').eq('id', id).single();
  if (fetchErr) {
    console.error('Error fetching URL for deleteQrCode:', fetchErr.message || fetchErr);
    throw new Error('Không thể tìm thấy đường link để xoá mã QR');
  }

  if (current && current.qr_code) {
    const prevFile = current.qr_code.split('/').pop();
    if (prevFile) {
      try {
        const bucket = 'qrs';
        // Call backend API to delete QR file from Tebi.io
        const response = await fetch(`https://url-shortener-backend.fegeltronics.workers.dev/api/delete-qr`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            // Add authorization header if needed
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
          },
          body: JSON.stringify({ bucket, key: prevFile })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Không thể xoá mã QR khỏi bộ nhớ');
        }
      } catch (e) {
        console.error('Error removing QR file from Tebi.io (backend):', e.message || e);
        throw new Error('Không thể xoá mã QR khỏi bộ nhớ');
      }
    }
  }

  // Update DB to clear qr_code
  const { data, error } = await supabase.from('urls').update({ qr_code: null }).eq('id', id).select();
  if (error) {
    console.error(error.message);
    throw new Error('Không thể cập nhật đường link sau khi xoá mã QR');
  }

  return data;
}
