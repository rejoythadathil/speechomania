import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ejs from 'ejs'
import writeExcelFile from 'write-excel-file/node'
import { audit } from '../../audit/service/index.js'
import { valkey } from '../../cache/service/index.js'
import { db } from '../../db/service/index.js'
import { logger } from '../../logger/service/index.js'
import {
  ART_NAME,
  EXPORTS_PER_MINUTE,
  ISSUED_ACTION,
  PDF_FONT_FILES,
  PDF_PERMISSIONS,
  RENDER_QUEUE,
  RENDER_SLOTS,
  VERIFY_URL,
  XLSX_TYPE
} from '../constants/index.js'
import { reportsBusy, tooManyExports } from '../exception/index.js'
import { aiNotice, documentCode, microtext, sha256Hex } from '../utils/index.js'

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
const fontDir = new URL('../fonts/', import.meta.url).pathname
const artDir = new URL('../art/', import.meta.url).pathname
const fonts = Object.fromEntries(
  Object.entries(PDF_FONT_FILES).map(([family, files]) => [
    family,
    Object.fromEntries(Object.entries(files).map(([style, file]) => [style, `${fontDir}${file}`]))
  ])
)
const fontFiles = new Set(Object.values(fonts).flatMap((styles) => Object.values(styles)))
pdfmake.addFonts(fonts)
pdfmake.setLocalAccessPolicy((path) => fontFiles.has(path))
pdfmake.setUrlAccessPolicy(() => false)
pdfmake.addTableLayouts({
  tiles: {
    hLineWidth: () => 0,
    vLineWidth: (index, node) => (index === 0 || index === node.table.widths.length ? 0 : 10),
    vLineColor: () => '#ffffff',
    paddingLeft: () => 14,
    paddingRight: () => 14,
    paddingTop: () => 12,
    paddingBottom: () => 12
  },
  rows: {
    hLineWidth: (index, node) => (index === 0 || index === node.table.body.length ? 0 : 0.6),
    hLineColor: () => '#e3e9f0',
    vLineWidth: () => 0,
    paddingLeft: (index) => (index === 0 ? 0 : 8),
    paddingRight: () => 8,
    paddingTop: () => 6,
    paddingBottom: () => 6
  },
  note: {
    hLineWidth: () => 0,
    vLineWidth: (index) => (index === 0 ? 3 : 0),
    vLineColor: () => '#1479bb',
    paddingLeft: () => 12,
    paddingRight: () => 12,
    paddingTop: () => 9,
    paddingBottom: () => 9
  },
  cut: {
    hLineWidth: () => 0.7,
    vLineWidth: () => 0.7,
    hLineColor: () => '#aab7c4',
    vLineColor: () => '#aab7c4',
    hLineStyle: () => ({ dash: { length: 5, space: 4 } }),
    vLineStyle: () => ({ dash: { length: 5, space: 4 } }),
    paddingLeft: () => 14,
    paddingRight: () => 14,
    paddingTop: () => 14,
    paddingBottom: () => 10
  }
})

const templates = new Map()
const json = (value) => JSON.stringify(value ?? '')

export function renderTemplate(name, data) {
  if (!templates.has(name)) {
    const filename = new URL(`../templates/${name}.json.ejs`, import.meta.url).pathname
    templates.set(name, ejs.compile(readFileSync(filename, 'utf8'), { filename }))
  }
  return JSON.parse(templates.get(name)({ ...data, json }))
}

const artCache = new Map()

export function artImages(names) {
  const images = {}
  for (const name of new Set(names)) {
    if (!ART_NAME.test(name ?? '')) continue
    if (!artCache.has(name)) {
      const path = `${artDir}${name}.png`
      artCache.set(
        name,
        existsSync(path) ? `data:image/png;base64,${readFileSync(path).toString('base64')}` : null
      )
    }
    if (artCache.get(name)) images[name] = artCache.get(name)
  }
  return images
}

function edges(code, owner) {
  return (page, size) => [
    {
      text: microtext(code, owner),
      fontSize: 2.6,
      color: '#c3d3e2',
      absolutePosition: { x: 16, y: 7 }
    },
    {
      text: microtext(code, owner),
      fontSize: 2.6,
      color: '#c3d3e2',
      absolutePosition: { x: 16, y: size.height - 11 }
    },
    {
      text: aiNotice(code),
      fontSize: 1,
      color: '#ffffff',
      absolutePosition: { x: 40, y: size.height - 18 }
    }
  ]
}

export async function pdfFile(definition, { code, owner }) {
  const document = {
    ...definition,
    defaultStyle: { font: 'Jakarta', ...definition.defaultStyle },
    info: {
      ...definition.info,
      author: 'Speechomania',
      creator: 'Speechomania',
      producer: 'Speechomania',
      subject: `Protected document ${code}. Check it at ${VERIFY_URL}`,
      keywords: `${code} speechomania protected`
    },
    ownerPassword: randomBytes(24).toString('hex'),
    permissions: PDF_PERMISSIONS,
    watermark: definition.watermark && {
      ...definition.watermark,
      text: `${definition.watermark.text} · ${code}`
    },
    background: edges(code, owner),
    footer: (page, pages) => ({
      margin: [44, 18, 44, 0],
      columns: [
        {
          text: `Check this copy at ${VERIFY_URL} · ${code}`,
          link: `https://${VERIFY_URL}/${code}`,
          color: '#7a8594'
        },
        { text: `Page ${page} of ${pages}`, alignment: 'right', color: '#7a8594' }
      ],
      fontSize: 7.5
    })
  }
  return Buffer.from(await pdfmake.createPdf(document).getBuffer())
}

export async function issuePdf({ definition, kind, owner, user, entityId, diff = {}, ctx }) {
  const code = documentCode()
  const body = await withRenderSlot(() => pdfFile(definition, { code, owner }))
  await audit(db, {
    actor: user,
    action: ISSUED_ACTION,
    entityType: 'child',
    entityId,
    diff: { code, kind, sha256: sha256Hex(body), bytes: body.length, ...diff },
    ctx
  })
  return { body, code }
}

export const xlsxFile = async (sheets) => Buffer.from(await writeExcelFile(sheets).toBuffer())

export function fileResponse(c, { body, fileName, type = XLSX_TYPE }) {
  return c.body(body, 200, {
    'Content-Type': type,
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Cache-Control': 'no-store'
  })
}
