import supabase from './supabase';

export async function getAllUsers() {
  // Fetch from backend API
  try {
    const res = await fetch('/api/admin/users', {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Không thể tải danh sách người dùng');
    }
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getAllUrls() {
  // Fetch all URLs
  const { data: urls, error: urlsError } = await supabase
    .from("urls")
    .select("*, user_id")
    .order("created_at", { ascending: false });

  if (urlsError) {
    console.error(urlsError.message);
    throw new Error("Không thể tải danh sách URLs");
  }

  // Since we can't join auth.users client-side, we'll use a different approach
  // For now, just return URLs without user names
  // Fetch click counts
  const { data: clicks, error: clicksError } = await supabase
    .from("clicks")
    .select("url_id");

  if (clicksError) {
    console.error(clicksError.message);
    throw new Error("Không thể tải số lượt click");
  }

  const clickCountMap = {};
  clicks.forEach(click => {
    clickCountMap[click.url_id] = (clickCountMap[click.url_id] || 0) + 1;
  });

  return urls.map(url => ({
    id: url.id,
    title: url.title,
    original_url: url.original_url,
    short_url: url.short_url,
    custom_url: url.custom_url,
    created_at: url.created_at,
    user_id: url.user_id,
    clicks_count: clickCountMap[url.id] || 0
  }));
}

export async function getAdmin() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  if (!user) return false;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    // Handle cases where the profile doesn't exist
    if (profileError.code === 'PGRST116') {
      return false;
    }
    throw new Error(profileError.message);
  }

  return profile?.is_admin || false;
}

export async function getAllBioPages() {
  // Fetch all bio pages
  const { data: bioPages, error: bioError } = await supabase
    .from("bio_page")
    .select("*, user_id")
    .order("created_at", { ascending: false });

  if (bioError) {
    console.error(bioError.message);
    throw new Error("Không thể tải danh sách bio pages");
  }

  // Fetch bio_urls with URLs
  const { data: bioUrls, error: bioUrlsError } = await supabase
    .from("bio_urls")
    .select(`
      bio_id,
      url_id,
      urls!inner(title, short_url)
    `)
    .order("created_at", { ascending: false });

  if (bioUrlsError) {
    console.error(bioUrlsError.message);
    throw new Error("Không thể tải bio URLs");
  }

  const bioUrlMap = {};
  bioUrls.forEach(bu => {
    if (!bioUrlMap[bu.bio_id]) {
      bioUrlMap[bu.bio_id] = [];
    }
    bioUrlMap[bu.bio_id].push({
      url_title: bu.urls.title,
      short_url: bu.urls.short_url
    });
  });

  return bioPages.map(bp => ({
    bio_page_id: bp.id,
    title: bp.title,
    description: bp.description,
    created_at: bp.created_at,
    user_id: bp.user_id,
    urls: bioUrlMap[bp.id] || []
  }));
}
