import { UAParser } from 'ua-parser-js';
import supabase from './supabase';

export async function getClicksForUrls(urlIds) {
  const {data, error} = await supabase
    .from("clicks")
    .select("*")
    .in("url_id", urlIds);

  if (error) {
    console.error("Error fetching clicks:", error);
    return null;
  }

  return data;
}

const parser = new UAParser();

export const storeClicks = async ({id, originalUrl}) => {
  try {
    console.log('Starting click recording for URL ID:', id);

    const res = parser.getResult();
    const device = res.type || "desktop"; // Default to desktop if type is not detected
    console.log('Device detected:', device);

    const response = await fetch("https://ipinfo.io/json");
    const locationData = await response.json();
    const {city, country} = locationData;
    console.log('Location detected:', {city, country});

    // Record the click
    const { data, error } = await supabase.from("clicks").insert({
      url_id: id,
      city: city,
      country: country,
      device: device,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    console.log('Click recorded successfully:', data);
    return data;

    // Removed redirect from here to avoid conflict with frontend redirect
    // window.location.href = originalUrl;
  } catch (error) {
    console.error("Error recording click:", error);
    throw error; // Re-throw error so calling code can handle it
  }
};

export async function getClicksForUrl(url_id) {
  const { data, error } = await supabase.from("clicks").select("*")
  .eq("url_id", url_id);
  if (error) {
    console.error(error.message);
    throw new Error("Không thể tải thông số");
  }
  return data
}

