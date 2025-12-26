import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 Client
const s3Client = new S3Client({
    region: import.meta.env.VITE_AWS_REGION,
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Uploads a file to AWS S3
 * @param {File} file - The file object to upload
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadFileToS3 = async (file) => {
    // 1. Validate file
    if (!file) {
        throw new Error('No file provided for upload.');
    }

    // 2. Generate unique filename (timestamp + original name clean)
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${timestamp}-${cleanFileName}`;

    // 3. Prepare upload command
    // Fix: Convert File to ArrayBuffer to avoid "readableStream.getReader is not a function" error
    // This explicitly prevents the SDK from treating it as a complex stream.
    const fileBuffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
        Bucket: import.meta.env.VITE_AWS_BUCKET_NAME,
        Key: key,
        Body: new Uint8Array(fileBuffer), // Use Uint8Array for browser compatibility
        ContentType: file.type,
        ContentLength: file.size
    });

    try {
        // 4. Send upload command
        await s3Client.send(command);

        // 5. Construct public URL (assuming standard S3 public access)
        // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        const bucket = import.meta.env.VITE_AWS_BUCKET_NAME;
        const region = import.meta.env.VITE_AWS_REGION;

        const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

        return url;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw error;
    }
};
