import writeExcelFile from 'write-excel-file/node'
import { valkey } from '../../cache/service/index.js'
import { logger } from '../../logger/service/index.js'
import { EXPORTS_PER_MINUTE, RENDER_QUEUE, RENDER_SLOTS, XLSX_TYPE } from '../constants/index.js'
import { reportsBusy, tooManyExports } from '../exception/index.js'

let running = 0
const waiting = []

export async function withRenderSlot(render) {
  if (running >= RENDER_SLOTS) {
    if (waiting.length >= RENDER_QUEUE) throw reportsBusy()
    await new Promise((resolve) => waiting.push(resolve))
  }
  running += 1
  try {
    return await render()
  } finally {
    running -= 1
    waiting.shift()?.()
  }
}

export async function limitExports(user) {
  const key = `exports:${user.id}:${Math.floor(Date.now() / 60000)}`
  let count = 0
  try {
    count = await valkey.incr(key)
    if (count === 1) await valkey.expire(key, 60)
  } catch (error) {
    logger.warn({ err: error }, 'export limiter unavailable')
  }
  if (count > EXPORTS_PER_MINUTE) throw tooManyExports()
}

export const xlsxFile = async (sheets) => Buffer.from(await writeExcelFile(sheets).toBuffer())

export function fileResponse(c, { body, fileName, type = XLSX_TYPE }) {
  return c.body(body, 200, {
    'Content-Type': type,
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Cache-Control': 'no-store'
  })
}
