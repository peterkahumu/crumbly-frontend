import { v2 as cloudinary } from "cloudinary";

// Server-only Cloudinary client — configured with the API secret, so this
// must never be imported into client-side code. Used to push
// baker-uploaded images (see pages/api/upload.js) from serverless functions
// where the local filesystem isn't writable/persistent.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
