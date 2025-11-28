import supabase, { supabaseUrl } from './supabase';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { compressImage } from '@/lib/utils';

// Fetch a single bio page by id
export async function fetchBio(id) {
  try {
    const { data, error } = await supabase
      .from('bio_page')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching bio:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Exception in fetchBio:', error);
    throw error;
  }
}

// Fetch a single bio page by url (slug)
export async function fetchBioByUrl(url) {
  try {
    const { data, error } = await supabase
      .from('bio_page')
      .select('*')
      .eq('url', url)
      .single();

    if (error) {
      console.error('Error fetching bio by url:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Exception in fetchBioByUrl:', error);
    throw error;
  }
}

// New function to fetch all bio pages for a user by user_id
export async function fetchBiosByUser(user_id) {
  if (!user_id) return [];

  const { data, error } = await supabase
    .from('bio_page')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bios by user:', error);
    return [];
  }

  return data || [];
}

// New function to fetch bio_urls for a given bio_id
export async function getBioUrls(bioId) {
  if (!bioId) return [];

  const { data, error } = await supabase
    .from('bio_urls')
    .select('url_id, urls!inner(title, profile_pic, short_url, qr_code)')
    .eq('bio_id', bioId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching bio URLs:', error);
    return [];
  }

  return data || [];
}

// Delete a bio URL from a bio page
export async function deleteBioUrl(bioId, urlId) {
  if (!bioId || !urlId) {
    throw new Error('Bio ID and URL ID are required');
  }

  const { data, error } = await supabase
    .from('bio_urls')
    .delete()
    .eq('bio_id', bioId)
    .eq('url_id', urlId);

  if (error) {
    console.error('Error deleting bio URL:', error);
    throw new Error('Failed to delete bio URL');
  }

  return data;
}

export async function deleteBio(id) {
  // Fetch the bio page record to get the profile pic and background URLs
  const { data: bioData, error: fetchError } = await supabase.from("bio_page").select("profile_pic, background").eq("id", id).single();
  if (fetchError) {
    console.error(fetchError.message);
    throw new Error("Không thể tìm thấy trang bio để xoá");
  }

  // Delete all bio_urls records for this bio page
  const { error: bioUrlsError } = await supabase.from("bio_urls").delete().eq("bio_id", id);
  if (bioUrlsError) {
    console.error(bioUrlsError.message);
    throw new Error("Không thể xoá các liên kết của bio page");
  }

  // If profile pic exists, delete it from Tebi.io via backend
  if (bioData.profile_pic) {
    const fileName = bioData.profile_pic.split('/').pop();
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/tebi/delete-qr`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify({ bucket: 'bioprofilepic', key: fileName })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xoá ảnh đại diện khỏi bộ nhớ');
      }
    } catch (e) {
      console.error('Error removing profile pic from Tebi.io (backend):', e.message || e);
      throw new Error('Không thể xoá ảnh đại diện khỏi bộ nhớ');
    }
  }

  // If background pic exists, delete it from Tebi.io via backend
  if (bioData.background) {
    const fileName = bioData.background.split('/').pop();
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/tebi/delete-qr`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify({ bucket: 'biobackground', key: fileName })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xoá ảnh nền khỏi bộ nhớ');
      }
    } catch (e) {
      console.error('Error removing background pic from Tebi.io (backend):', e.message || e);
      throw new Error('Không thể xoá ảnh nền khỏi bộ nhớ');
    }
  }

  // Delete the bio page record
  const { data, error } = await supabase.from("bio_page").delete().eq("id", id);
  if (error) {
    console.error(error.message);
    throw new Error("Không thể xoá trang bio");
  }
  return data;
}

export async function checkTitleExistsBio(title, user_id) {
  const { data, error } = await supabase.from("bio_page").select("title").eq("title", title).eq("user_id", user_id);
  if (error) {
    console.error(error.message);
    throw new Error("Không thể kiểm tra tiêu đề");
  }
  return data && data.length > 0;
}

export async function updateBio(options, updates, newProfilePic = null, newBackgroundPic = null) {
  const { id, user_id } = options;
  // First, get the current bio to check user_id and get current data
  const { data: currentBio, error: fetchError } = await supabase
    .from("bio_page")
    .select("user_id, title, url, profile_pic, background")
    .eq("id", id)
    .single();
  if (fetchError) {
    console.error(fetchError.message);
    throw new Error("Không thể tìm thấy trang bio để cập nhật");
  }
  if (currentBio.user_id !== user_id) {
    throw new Error("Không có quyền cập nhật trang bio này");
  }

  // Prepare updates
  const dbUpdates = { ...updates };

  // If title is updated, generate new url with preserved or new 6-char suffix (case-sensitive)
  if (dbUpdates.title && dbUpdates.title !== currentBio.title) {
    // Ensure title is unique per user
    const exists = await checkTitleExistsBio(dbUpdates.title, user_id);
    if (exists) {
      throw new Error("Tiêu đề này đã được bạn sử dụng. Vui lòng chọn tiêu đề khác.");
    }
    const baseSlug = dbUpdates.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'bio';
    // Attempt to preserve existing suffix if present
    const suffixMatch = /-([A-Za-z0-9]{6})$/.exec(currentBio.url || '');
    let suffix = suffixMatch ? suffixMatch[1] : '';
    if (!suffix) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    dbUpdates.url = `${baseSlug}-${suffix}`;
  }

  // Handle profile pic update
  if (newProfilePic) {
    // Delete old profile pic if exists
    if (currentBio.profile_pic) {
      const oldFileName = currentBio.profile_pic.split('/').pop();
      try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/tebi/delete-qr`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
          },
          body: JSON.stringify({ bucket: 'bioprofilepic', key: oldFileName })
        });
      } catch (e) {
        // Don't throw, continue with update
      }
    }
    // Compress profile image to ~20KB before upload
    let toUploadProfile = newProfilePic;
    try {
      toUploadProfile = await compressImage(newProfilePic, 20 * 1024, 800);
    } catch (e) {
      console.warn('Profile pic compression failed, uploading original', e);
      toUploadProfile = newProfilePic;
    }
    // Upload new profile pic to Tebi.io directly from frontend using AWS SDK
    const uniqueSuffix = Date.now();
    const fileName = `profile-${dbUpdates.url || currentBio.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${uniqueSuffix}.png`;
    const s3 = new S3Client({
      region: 'us-east-1',
      endpoint: 'https://s3.tebi.io',
      credentials: {
        accessKeyId: import.meta.env.VITE_TEBI_ACCESS_KEY,
        secretAccessKey: import.meta.env.VITE_TEBI_SECRET_KEY,
      },
    });
    let uploadedUrl = null;
    try {
      const arrayBuffer = await toUploadProfile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await s3.send(new PutObjectCommand({
        Bucket: 'bioprofilepic',
        Key: fileName,
        Body: uint8Array,
        ContentType: toUploadProfile.type || 'image/png',
      }));
      uploadedUrl = `https://s3.tebi.io/bioprofilepic/${fileName}`;
    } catch (err) {
      throw new Error('Không thể tải lên ảnh đại diện mới: ' + err.message);
    }
    dbUpdates.profile_pic = uploadedUrl;
  }

  // Handle background pic update
  if (newBackgroundPic) {
    // Delete old background pic if exists
    if (currentBio.background) {
      const oldFileName = currentBio.background.split('/').pop();
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/tebi/delete-qr`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
          },
          body: JSON.stringify({ bucket: 'biobackground', key: oldFileName })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Không thể xoá ảnh nền khỏi bộ nhớ');
        }
      } catch (e) {
        console.error('Error removing background pic from Tebi.io (backend):', e.message || e);
        // Don't throw, continue with update
      }
    }
    // Compress background image to ~50KB before upload
    let toUploadBg = newBackgroundPic;
    try {
      toUploadBg = await compressImage(newBackgroundPic, 50 * 1024, 1200);
    } catch (e) {
      console.warn('Background pic compression failed, uploading original', e);
      toUploadBg = newBackgroundPic;
    }
    // Upload new background pic to Tebi.io directly from frontend using AWS SDK
    const uniqueSuffix = Date.now();
    const fileName = `background-${dbUpdates.url || currentBio.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${uniqueSuffix}.png`;
    const s3 = new S3Client({
      region: 'us-east-1',
      endpoint: 'https://s3.tebi.io',
      credentials: {
        accessKeyId: import.meta.env.VITE_TEBI_ACCESS_KEY,
        secretAccessKey: import.meta.env.VITE_TEBI_SECRET_KEY,
      },
    });
    let uploadedUrl = null;
    try {
      const arrayBuffer = await toUploadBg.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await s3.send(new PutObjectCommand({
        Bucket: 'biobackground',
        Key: fileName,
        Body: uint8Array,
        ContentType: toUploadBg.type || 'image/png',
      }));
      uploadedUrl = `https://s3.tebi.io/biobackground/${fileName}`;
    } catch (err) {
      throw new Error('Không thể tải lên ảnh nền mới: ' + err.message);
    }
    dbUpdates.background = uploadedUrl;
  }

  try {
    const { data, error } = await supabase
      .from("bio_page")
      .update(dbUpdates)
      .eq("id", id)
      .select("id, title, url, description, profile_pic, background");
    if (error) {
      console.error(error.message);
      throw new Error("Không thể cập nhật trang bio");
    }
    // Return the single updated row
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('Exception in updateBio:', error);
    throw error;
  }
}

// Add a URL to a bio page
export async function addBioUrl(bioId, urlId) {
  if (!bioId || !urlId) {
    throw new Error('Bio ID and URL ID are required');
  }

  const { data, error } = await supabase
    .from('bio_urls')
    .insert([
      {
        bio_id: bioId,
        url_id: urlId,
      },
    ])
    .select();

  if (error) {
    console.error('Error adding URL to bio:', error);
    throw new Error('Failed to add URL to bio page');
  }

  return data;
}

// Create a new bio page
export async function createBioPage({ title, profilePic, user_id }) {
  try {
    // Ensure title is unique per user
    const exists = await checkTitleExistsBio(title, user_id);
    if (exists) {
      throw new Error("Tiêu đề này đã được bạn sử dụng. Vui lòng chọn tiêu đề khác.");
    }

    // Generate base slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'bio';

    // Helper to create a 6-char random string (case-sensitive)
    const rand6 = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    // Try to ensure URL uniqueness by checking existing records
    let url = '';
    for (let i = 0; i < 5; i++) {
      const candidate = `${baseSlug}-${rand6()}`;
      const { count, error: countError } = await supabase
        .from('bio_page')
        .select('id', { count: 'exact', head: true })
        .eq('url', candidate);
      if (!countError && (!count || count === 0)) {
        url = candidate;
        break;
      }
    }
    // Fallback if uniqueness check above failed repeatedly
    if (!url) url = `${baseSlug}-${Date.now().toString(36).slice(-6)}`;

    let profile_pic_url = null;

    if (profilePic) {
      // Compress profile image to ~20KB before upload
      let toUpload = profilePic;
      try {
        toUpload = await compressImage(profilePic, 20 * 1024, 800);
      } catch (e) {
        console.warn('Profile pic compression failed during createBioPage, uploading original', e);
        toUpload = profilePic;
      }

      // Generate a unique file name for the profile picture
      const fileName = `profile-${url}.png`;

      // Upload profile picture to Tebi.io directly from frontend using AWS SDK
      const s3 = new S3Client({
        region: 'us-east-1',
        endpoint: 'https://s3.tebi.io',
        credentials: {
          accessKeyId: import.meta.env.VITE_TEBI_ACCESS_KEY,
          secretAccessKey: import.meta.env.VITE_TEBI_SECRET_KEY,
        },
      });
      let uploadedUrl = null;
      try {
        const arrayBuffer = await toUpload.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        await s3.send(new PutObjectCommand({
          Bucket: 'bioprofilepic',
          Key: fileName,
          Body: uint8Array,
          ContentType: toUpload.type || 'image/png',
        }));
        uploadedUrl = `https://s3.tebi.io/bioprofilepic/${fileName}`;
      } catch (err) {
        throw new Error('Không thể tải lên ảnh đại diện: ' + err.message);
      }
      profile_pic_url = uploadedUrl;
    }

    const { data, error } = await supabase
      .from("bio_page")
      .insert([
        {
          title,
          user_id,
          profile_pic: profile_pic_url,
          url,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating bio page:", error);
      throw new Error("Không thể tạo trang bio");
    }

    return data;
  } catch (error) {
    console.error('Exception in createBioPage:', error);
    throw error;
  }
}
