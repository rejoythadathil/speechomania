import { createHash, createHmac } from 'node:crypto'
import { SIGNATURE_ALGORITHM } from '../constants/index.js'

const hmac = (key, text) => createHmac('sha256', key).update(text).digest()
const sha256 = (text) => createHash('sha256').update(text).digest('hex')

export function createBucketRequest({ endpoint, region, accessKeyId, secretAccessKey, bucket }, now = new Date()) {
  const url = new URL(`/${bucket}`, endpoint)
  const stamp = now.toISOString().replace(/[-:]|\.\d{3}/g, '')
  const day = stamp.slice(0, 8)
  const scope = `${day}/${region}/s3/aws4_request`
  const headers = { host: url.host, 'x-amz-content-sha256': sha256(''), 'x-amz-date': stamp }
  const names = Object.keys(headers).sort()
  const canonical = ['PUT', url.pathname, '', ...names.map((name) => `${name}:${headers[name]}`), '', names.join(';'), headers['x-amz-content-sha256']].join('\n')
  const toSign = [SIGNATURE_ALGORITHM, stamp, scope, sha256(canonical)].join('\n')
  const key = ['s3', 'aws4_request'].reduce((acc, part) => hmac(acc, part), hmac(hmac(`AWS4${secretAccessKey}`, day), region))
  const signature = createHmac('sha256', key).update(toSign).digest('hex')
  const authorization = `${SIGNATURE_ALGORITHM} Credential=${accessKeyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}`
  return { url, headers: { ...headers, authorization } }
}
