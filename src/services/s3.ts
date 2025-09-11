import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'us-east-2';
export const s3 = new S3Client({ region });

export async function putJson(bucket: string, key: string, body: unknown) {
    const cmd = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(body),
        ContentType: 'application/json',
        CacheControl: 'no-cache' 
    });
    return s3.send(cmd);
}
