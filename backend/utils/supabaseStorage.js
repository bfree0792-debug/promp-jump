const path = require("path");
const { supabase } = require("../lib/supabase");

const BUCKET_NAME = "images";

/**
 * Uploads a file buffer (from multer memoryStorage) to Supabase Storage.
 *
 * @param {Express.Multer.File} file - Multer file object
 * @param {string} folder - Folder name within the bucket (e.g. "prompts", "categories", "avatars")
 * @returns {Promise<string>} Public URL of the uploaded object
 */
async function uploadToSupabase(file, folder = "prompts") {
  if (!file || !file.buffer) {
    throw new Error("No file buffer provided for upload.");
  }

  const ext = path.extname(file.originalname || "") || (file.mimetype.startsWith("video/") ? ".mp4" : ".png");
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = `${folder}/${uniqueName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw new Error(`Failed to upload media to Supabase: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

/**
 * Deletes a file from Supabase Storage given its public URL or storage path.
 *
 * @param {string} urlOrPath - The full public URL or relative file path in the bucket
 */
async function deleteFromSupabase(urlOrPath) {
  if (!urlOrPath) return;

  try {
    let filePath = urlOrPath;

    if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
      const parsed = new URL(urlOrPath);
      const prefix = `/storage/v1/object/public/${BUCKET_NAME}/`;
      const index = parsed.pathname.indexOf(prefix);
      if (index !== -1) {
        filePath = decodeURIComponent(parsed.pathname.slice(index + prefix.length));
      } else {
        // Not a Supabase storage URL for this bucket
        return;
      }
    }

    if (filePath) {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      if (error) {
        console.warn("Supabase Storage remove warning:", error.message);
      }
    }
  } catch (err) {
    console.warn("Error deleting file from Supabase Storage:", err.message);
  }
}

module.exports = {
  BUCKET_NAME,
  uploadToSupabase,
  deleteFromSupabase,
};
