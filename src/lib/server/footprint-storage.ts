import COS from "cos-nodejs-sdk-v5";
import { randomUUID } from "node:crypto";
import { assertEnv, env } from "@/lib/env";
import { getShanghaiDateParts } from "@/lib/footprint-time";

const mimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
};

const normalizeExt = (filename: string, mimeType: string): string => {
  const fromMime = mimeToExt[mimeType.toLowerCase()];
  if (fromMime) return fromMime;
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext?.replace(/[^a-z0-9]/g, "") || "jpg";
};

const buildPublicUrl = (objectKey: string): string => {
  assertEnv("COS_PUBLIC_BASE_URL");
  return `${env.COS_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey}`;
};

const client = () => {
  assertEnv("COS_SECRET_ID", "COS_SECRET_KEY");
  return new COS({ SecretId: env.COS_SECRET_ID, SecretKey: env.COS_SECRET_KEY });
};

export interface UploadedFootprintPhoto {
  objectKey: string;
  url: string;
}

export const uploadFootprintPhotoToCos = async (
  userId: string,
  file: File,
): Promise<UploadedFootprintPhoto> => {
  assertEnv("COS_BUCKET", "COS_REGION", "COS_SECRET_ID", "COS_SECRET_KEY");

  const { year, month } = getShanghaiDateParts();
  const extension = normalizeExt(file.name, file.type || "image/jpeg");
  const objectKey = `footprints/${userId}/${year}/${String(month).padStart(2, "0")}/${randomUUID()}.${extension}`;
  const body = Buffer.from(await file.arrayBuffer());

  await new Promise<void>((resolve, reject) => {
    client().putObject(
      {
        Bucket: env.COS_BUCKET,
        Region: env.COS_REGION,
        Key: objectKey,
        Body: body,
        ContentType: file.type || "image/jpeg",
      },
      (error) => {
        if (error) return reject(error);
        resolve();
      },
    );
  });

  return { objectKey, url: buildPublicUrl(objectKey) };
};
