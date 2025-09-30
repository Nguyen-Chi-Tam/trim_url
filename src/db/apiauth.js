import supabase, { supabaseUrl } from './supabase';

export async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
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
        const fileName = `dp-${name.split(" ").join("_")}-${Math.random()}`;
        const { error: storageErr } = await supabase.storage.from("profile_pic").upload(fileName, profile_pic);
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
