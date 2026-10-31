export const storageNotConfigured = () => new Error('S3 is not configured: set S3_ENDPOINT, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY')

export const bucketNotCreated = (bucket, status, detail) => new Error(`Could not create bucket ${bucket}: ${status} ${detail}`)
