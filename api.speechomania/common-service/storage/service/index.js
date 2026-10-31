import { S3Client } from 'bun'
import { config } from '../../../config/index.js'
import { BUCKET_EXISTS_STATUS } from '../constants/index.js'
import { bucketNotCreated, storageNotConfigured } from '../exception/index.js'
import { createBucketRequest } from '../utils/index.js'

const settings = {
  endpoint: config.S3_ENDPOINT,
  region: config.S3_REGION,
  accessKeyId: config.S3_ACCESS_KEY_ID,
  secretAccessKey: config.S3_SECRET_ACCESS_KEY,
  bucket: config.S3_MEDIA_BUCKET
}

export const mediaReady = Boolean(settings.endpoint && settings.accessKeyId && settings.secretAccessKey)
export const media = mediaReady ? new S3Client(settings) : null

export function mediaUrl(key) {
  if (!media || !key) return null
  return media.presign(key, { expiresIn: config.MEDIA_URL_TTL_SECONDS })
}

export async function ensureMediaBucket() {
  if (!mediaReady) throw storageNotConfigured()
  const { url, headers } = createBucketRequest(settings)
  const response = await fetch(url, { method: 'PUT', headers })
  if (response.ok || response.status === BUCKET_EXISTS_STATUS) return
  throw bucketNotCreated(settings.bucket, response.status, await response.text())
}
