import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { ENV } from './env.config.js';

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = buffer => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'uploads' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export default uploadOnCloudinary;
