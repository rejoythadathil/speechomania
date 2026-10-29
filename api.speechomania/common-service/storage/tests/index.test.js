import { describe, expect, test } from 'bun:test'
import { ensureMediaBucket, media, mediaReady, mediaUrl } from '../service/index.js'
import { createBucketRequest } from '../utils/index.js'

const settings = { endpoint: 'http://127.0.0.1:7103', region: 'us-east-1', accessKeyId: 'key', secretAccessKey: 'secret', bucket: 'media' }

describe('bucket signing', () => {
  test('signs a path-style PUT for the bucket, the same way for the same moment', () => {
    const now = new Date('2026-10-29T10:00:00Z')
    const first = createBucketRequest(settings, now)
    expect(first.url.toString()).toBe('http://127.0.0.1:7103/media')
    expect(first.headers['x-amz-date']).toBe('20261029T100000Z')
    expect(first.headers.authorization).toStartWith('AWS4-HMAC-SHA256 Credential=key/20261029/us-east-1/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=')
    expect(createBucketRequest(settings, now).headers.authorization).toBe(first.headers.authorization)
    expect(createBucketRequest({ ...settings, secretAccessKey: 'other' }, now).headers.authorization).not.toBe(first.headers.authorization)
  })

  test('no key gives no URL', () => {
    expect(mediaUrl(null)).toBeNull()
  })
})

describe.if(mediaReady)('media bucket', () => {
  test('bucket creation is repeatable and signed URLs serve the file', async () => {
    await ensureMediaBucket()
    await ensureMediaBucket()
    const key = `test/${crypto.randomUUID()}.txt`
    await media.write(key, 'hello')
    const response = await fetch(mediaUrl(key))
    expect(await response.text()).toBe('hello')
    await media.delete(key)
  })
})
