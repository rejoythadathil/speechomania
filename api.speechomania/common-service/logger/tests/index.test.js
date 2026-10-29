import { expect, test } from 'bun:test'
import pino from 'pino'
import { loggerOptions } from '../utils/index.js'

test('personal data is redacted from logs', () => {
  const lines = []
  const log = pino({ ...loggerOptions({ LOG_LEVEL: 'info', APP_ENV: 'local' }) }, { write: (line) => lines.push(JSON.parse(line)) })
  log.info({ email: 'parent@example.com', phone: '9999999999', body: { pin: '1234' }, path: '/v1/children' }, 'request')
  expect(lines[0]).toMatchObject({ email: '[Redacted]', phone: '[Redacted]', body: '[Redacted]', path: '/v1/children', service: 'api' })
})
