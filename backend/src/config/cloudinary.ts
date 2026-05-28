import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Original Upload Function
export const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "nomads_profiles"
    });

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return response;

  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

/**
 * Helper to parse a Cloudinary secure_url and extract the public_id and resource_type.
 * Handles format: https://res.cloudinary.com/cloud_name/video/upload/v12345/nomads_profiles/filename.mp4
 */
const parseCloudinaryUrl = (url: string): { publicId: string; resourceType: "image" | "video" | "raw" } | null => {
  try {
    const urlParts = url.split("/");
    const uploadIndex = urlParts.indexOf("upload");
    
    if (uploadIndex === -1 || uploadIndex === urlParts.length - 1) return null;

    // Detect resource type (image, video, raw) positioned right before /upload/
    let resourceType: "image" | "video" | "raw" = "image";
    const detectedType = urlParts[uploadIndex - 1];
    if (detectedType === "video" || detectedType === "raw") {
      resourceType = detectedType;
    }

    // Join remaining parts after the version tag (e.g., v167234...) to get the full folder + public ID path
    const remainingParts = urlParts.slice(uploadIndex + 1);
    if (remainingParts[0].startsWith("v") && !isNaN(Number(remainingParts[0].substring(1)))) {
      remainingParts.shift(); // Remove version segment
    }

    // Strip the file extension out of the final path segment
    const fullPathWithExtension = remainingParts.join("/");
    const publicId = fullPathWithExtension.replace(/\.[^/.]+(?=\?|$)/, "");

    return { publicId, resourceType };
  } catch (error) {
    console.error("Failed to parse Cloudinary URL components:", error);
    return null;
  }
};

/**
 * Permanently deletes an asset from Cloudinary using its secure URL
 * @param url The full Cloudinary secure_url string
 */
export const deleteFromCloudinary = async (url: string): Promise<boolean> => {
  try {
    if (!url) return false;

    const target = parseCloudinaryUrl(url);
    if (!target) {
      console.warn("Could not extract Cloudinary asset paths from URL:", url);
      return false;
    }

    const response = await cloudinary.uploader.destroy(target.publicId, {
      resource_type: target.resourceType
    });

    return response.result === "ok";
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
    return false;
  }
};