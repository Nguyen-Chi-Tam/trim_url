import supabase, { supabaseUrl } from './supabase';
import { compressImage } from '@/lib/utils';

export async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw new Error(error.message);
    return data;
}

// Trigger Google OAuth sign-in/up. Supabase will handle both cases.
// redirectPath: optional path to return to after auth (e.g., '/auth?createNew=...').
export async function loginWithGoogle({ redirectPath } = {}) {
    const redirectTo = `${window.location.origin}${redirectPath || '/auth'}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo,
            queryParams: {
                // Request refresh token for long-lived sessions
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });
    if (error) throw new Error(error.message);
    return data;
}

export async function getCurrentUser() {
    const { data: session, error } = await supabase.auth.getSession();
    if (!session.session) return null;
    if (error) throw new Error(error.message);
    return session.session?.user;
}

export async function signup({ name, email, password, profile_pic }) {
    let profilePicUrl = null;
    if (profile_pic) {
        // Compress user profile picture to ~5KB to save storage/bandwidth
        let toUpload = profile_pic;
        try {
            toUpload = await compressImage(profile_pic, 5 * 1024, 400);
        } catch (e) {
            console.warn('Profile pic compression failed during signup, uploading original', e);
            toUpload = profile_pic;
        }

        const fileName = `dp-${name.split(" ").join("_")}-${Math.random()}`;
        const { error: storageErr } = await supabase.storage.from("profile_pic").upload(fileName, toUpload);
        if (storageErr) throw new Error(storageErr.message);
        profilePicUrl = `${supabaseUrl}/storage/v1/object/public/profile_pic/${fileName}`;
    } else {
        profilePicUrl = `${supabaseUrl}/storage/v1/object/public/profile_pic/default_user.png`;
    }
    const userData = {
        name,
    };
    if (profilePicUrl) {
        userData.profile_pic = profilePicUrl;
    }
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: userData,
        }
    });
    if (error) throw new Error(error.message);
    return data;
}

export async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
}

export async function resetPasswordForEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
}

export async function updateUser(updates) {
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw new Error(error.message);
    return data;
}

// Ensure user's metadata has name and profile_pic derived from OAuth provider info
export async function ensureUserMetadataFromProvider() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    const user = data?.user;
    if (!user) return null;
    const md = user.user_metadata || {};
    const currentName = md.name;
    const currentPic = md.profile_pic;

    // Common fields returned by Google: name, full_name, given_name, family_name, picture, avatar_url
    const providerName = md.name || md.full_name || (md.given_name || md.family_name ? `${md.given_name || ''} ${md.family_name || ''}`.trim() : '') || (user.email ? user.email.split('@')[0] : '');
    const providerPic = md.profile_pic || md.avatar_url || md.picture || null;

    const updates = {};
    if (!currentName && providerName) {
        updates.data = { ...(updates.data || {}), name: providerName };
    }
    if (!currentPic && providerPic) {
        updates.data = { ...(updates.data || {}), profile_pic: providerPic };
    }
    if (Object.keys(updates).length > 0) {
        const res = await supabase.auth.updateUser(updates);
        if (res.error) throw new Error(res.error.message);
        return res.data;
    }
    return null;
}
