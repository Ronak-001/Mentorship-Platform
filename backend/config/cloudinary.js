const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from multer memory storage
 * @param {object} options - Upload options
 * @param {string} options.resource_type - 'image', 'video', or 'raw' (for PDFs/docs)
 * @param {string} [options.folder] - Optional Cloudinary folder
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            resource_type: options.resource_type || 'auto',
            folder: options.folder || 'mentorship-platform',
        };

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Delete a file from Cloudinary by public_id.
 * @param {string} publicId - The Cloudinary public_id
 * @param {string} [resourceType] - 'image', 'video', or 'raw'
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
    }
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
