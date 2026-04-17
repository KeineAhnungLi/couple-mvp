import COS from "cos-nodejs-sdk-v5";
import { randomUUID } from "node:crypto";
import { assertEnv, env } from "@/lib/env";

const mimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
};

const normalizeExt = (filename: string, mimeType: string): string => {
  const fromMime = mimeToExt[mimeType.toLowerCase()];
  if (fromMime) {
    return fromMime;
  }

  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) {
    return "jpg";
  }

  return ext.replace(/[^a-z0-9]/g, "") || "jpg";
};

const buildPublicUrl = (objectKey: string): string => {
  assertEnv("COS_PUBLIC_BASE_URL");
  const base = env.COS_PUBLIC_BASE_URL.replace(/\/$/, "");
  return `${base}/${objectKey}`;
};

const cosClient = () => {
  assertEnv("COS_SECRET_ID", "COS_SECRET_KEY");

  return new COS({
    SecretId: env.COS_SECRET_ID,
    SecretKey: env.COS_SECRET_KEY,
  });
};

export interface UploadPhotoInput {
  file: File;
  coupleId: string;
}

export interface UploadedPhoto {
  objectKey: string;
  url: string;
}

export const buildPhotoObjectKey = (coupleId: string, file: File): string => {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const extension = normalizeExt(file.name, file.type || "image/jpeg");

  return `photos/${coupleId}/${year}/${month}/${randomUUID()}.${extension}`;
};

export const uploadPhotoToCos = async (
  input: UploadPhotoInput,
): Promise<UploadedPhoto> => {
  assertEnv("COS_BUCKET", "COS_REGION", "COS_SECRET_ID", "COS_SECRET_KEY");

  const objectKey = buildPhotoObjectKey(input.coupleId, input.file);
  const body = Buffer.from(await input.file.arrayBuffer());
  const client = cosClient();

  await new Promise<void>((resolve, reject) => {
    client.putObject(
      {
        Bucket: env.COS_BUCKET,
        Region: env.COS_REGION,
        Key: objectKey,
        Body: body,
        ContentType: input.file.type || "image/jpeg",
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      },
    );
  });

  return {
    objectKey,
    url: buildPublicUrl(objectKey),
  };
};
