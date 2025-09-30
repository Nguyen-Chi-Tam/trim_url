import supabase, { supabaseUrl } from './supabase';

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

  // If profile pic exists, delete it from storage
  if (bioData.profile_pic) {
    // Extract the file name from profile_pic URL
    const fileName = bioData.profile_pic.split('/').pop();

    // Delete the profile pic file from the "bio_profile_pic" storage bucket
    const { error: storageError } = await supabase.storage.from("bio_profile_pic").remove([fileName]);
    if (storageError) {
      console.error(storageError.message);
      throw new Error("Không thể xoá ảnh đại diện khỏi bộ nhớ");
    }
  }

  // If background pic exists, delete it from storage
  if (bioData.background) {
    // Extract the file name from background URL
    const fileName = bioData.background.split('/').pop();

    // Delete the background pic file from the "bio_background" storage bucket
    const { error: storageError } = await supabase.storage.from("bio_background").remove([fileName]);
    if (storageError) {
      console.error(storageError.message);
      throw new Error("Không thể xoá ảnh nền khỏi bộ nhớ");
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
  const { data: currentBio, error: fetchError } = await supabase.from("bio_page").select("user_id, title, profile_pic, background").eq("id", id).single();
  if (fetchError) {
    console.error(fetchError.message);
    throw new Error("Không thể tìm thấy trang bio để cập nhật");
  }
  if (currentBio.user_id !== user_id) {
    throw new Error("Không có quyền cập nhật trang bio này");
  }

  // Check for duplicate title
  if (updates.title && updates.title !== currentBio.title) {
    const titleExists = await checkTitleExistsBio(updates.title, user_id);
    if (titleExists) {
      throw new Error("Tiêu đề này đã được sử dụng. Vui lòng chọn tiêu đề khác.");
    }
  }

  // Prepare updates
  const dbUpdates = { ...updates };

  // If title is updated, generate new url
  if (dbUpdates.title) {
    dbUpdates.url = dbUpdates.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  // Handle profile pic removal
  if (dbUpdates.profile_pic === null && currentBio.profile_pic) {
    const oldFileName = currentBio.profile_pic.split('/').pop();
    const { error: deleteError } = await supabase.storage.from("bio_profile_pic").remove([oldFileName]);
    if (deleteError) {
      console.error(deleteError.message);
      // Don't throw, continue with update
    }
  }

  // Handle profile pic update
  if (newProfilePic) {
    // Delete old profile pic if exists
    if (currentBio.profile_pic) {
      const oldFileName = currentBio.profile_pic.split('/').pop();
      const { error: deleteError } = await supabase.storage.from("bio_profile_pic").remove([oldFileName]);
      if (deleteError) {
        console.error(deleteError.message);
        // Don't throw, continue with update
      }
    }

    // Upload new profile pic with unique filename
    const uniqueSuffix = Date.now();
    const fileName = `profile-${dbUpdates.url || currentBio.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${uniqueSuffix}.png`;
    const { error: storageError } = await supabase.storage
      .from("bio_profile_pic")
      .upload(fileName, newProfilePic);

    if (storageError) {
      console.error("Storage upload error:", storageError);
      throw new Error("Không thể tải lên ảnh đại diện mới");
    }

    dbUpdates.profile_pic = `${supabaseUrl}/storage/v1/object/public/bio_profile_pic/${fileName}`;
  }

  // Handle background pic removal
  if (dbUpdates.background === null && currentBio.background) {
    const oldFileName = currentBio.background.split('/').pop();
    const { error: deleteError } = await supabase.storage.from("bio_background").remove([oldFileName]);
    if (deleteError) {
      console.error(deleteError.message);
      // Don't throw, continue with update
    }
  }

  // Handle background pic update
  if (newBackgroundPic) {
    // Delete old background pic if exists
    if (currentBio.background) {
      const oldFileName = currentBio.background.split('/').pop();
      const { error: deleteError } = await supabase.storage.from("bio_background").remove([oldFileName]);
      if (deleteError) {
        console.error(deleteError.message);
        // Don't throw, continue with update
      }
    }

    // Upload new background pic with unique filename
    const uniqueSuffix = Date.now();
    const fileName = `background-${dbUpdates.url || currentBio.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${uniqueSuffix}.png`;
    const { error: storageError } = await supabase.storage
      .from("bio_background")
      .upload(fileName, newBackgroundPic);

    if (storageError) {
      console.error("Storage upload error:", storageError);
      throw new Error("Không thể tải lên ảnh nền mới");
    }

    dbUpdates.background = `${supabaseUrl}/storage/v1/object/public/bio_background/${fileName}`;
  }

  const { data, error } = await supabase.from("bio_page").update(dbUpdates).eq("id", id);
  if (error) {
    console.error(error.message);
    throw new Error("Không thể cập nhật trang bio");
  }
  return data;
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
    // Check if title already exists for this user
    const titleExists = await checkTitleExistsBio(title, user_id);
    if (titleExists) {
      throw new Error("Tiêu đề này đã được sử dụng. Vui lòng chọn tiêu đề khác.");
    }

    // Generate url from title (slugify)
    const url = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    let profile_pic_url = null;

    if (profilePic) {
      // Generate a unique file name for the profile picture
      const fileName = `profile-${url}.png`;

      console.log("Uploading profile picture file:", fileName, profilePic);
      const { error: storageError } = await supabase.storage
        .from("bio_profile_pic")
        .upload(fileName, profilePic);

      if (storageError) {
        console.error("Storage upload error:", storageError);
        throw new Error("Không thể tải lên ảnh đại diện");
      }

      profile_pic_url = `${supabaseUrl}/storage/v1/object/public/bio_profile_pic/${fileName}`;
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
