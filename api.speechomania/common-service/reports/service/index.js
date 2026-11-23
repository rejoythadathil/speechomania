import { createRequire } from 'node:module'
import writeExcelFile from 'write-excel-file/node'
import { valkey } from '../../cache/service/index.js'
import { logger } from '../../logger/service/index.js'
import {
  EXPORTS_PER_MINUTE,
  PDF_FONTS,
  RENDER_QUEUE,
  RENDER_SLOTS,
  XLSX_TYPE
} from '../constants/index.js'
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

const pdfmake = createRequire(import.meta.url)('pdfmake')
const builtInFonts = new Set(Object.values(PDF_FONTS.Helvetica))
pdfmake.addFonts(PDF_FONTS)
pdfmake.setLocalAccessPolicy((path) => builtInFonts.has(path))
pdfmake.setUrlAccessPolicy(() => false)

export async function pdfFile(definition, footerText = 'Speechomania') {
  const document = {
    ...definition,
    footer: (page, pages) => ({
      text: `${footerText} · Page ${page} of ${pages}`,
      alignment: 'center',
      fontSize: 8,
      color: '#5b6472',
      margin: [0, 20, 0, 0]
    })
  }
  return Buffer.from(await pdfmake.createPdf(document).getBuffer())
}

export const xlsxFile = async (sheets) => Buffer.from(await writeExcelFile(sheets).toBuffer())

export function fileResponse(c, { body, fileName, type = XLSX_TYPE }) {
  return c.body(body, 200, {
    'Content-Type': type,
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Cache-Control': 'no-store'
  })
}
