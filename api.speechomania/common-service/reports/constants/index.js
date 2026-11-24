export const RENDER_SLOTS = 2
export const RENDER_QUEUE = 8
export const EXPORTS_PER_MINUTE = 10
export const MAX_ROWS = 5000
export const PAGE_SIZE = 100
export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const PDF_TYPE = 'application/pdf'
export const PDF_FONT_FILES = {
  Jakarta: {
    normal: 'plus-jakarta-sans-latin-400-normal.woff',
    bold: 'plus-jakarta-sans-latin-700-normal.woff',
    italics: 'plus-jakarta-sans-latin-400-normal.woff',
    bolditalics: 'plus-jakarta-sans-latin-700-normal.woff'
  },
  JakartaSemi: {
    normal: 'plus-jakarta-sans-latin-600-normal.woff',
    bold: 'plus-jakarta-sans-latin-700-normal.woff',
    italics: 'plus-jakarta-sans-latin-600-normal.woff',
    bolditalics: 'plus-jakarta-sans-latin-700-normal.woff'
  },
  Bricolage: {
    normal: 'bricolage-grotesque-latin-600-normal.woff',
    bold: 'bricolage-grotesque-latin-700-normal.woff',
    italics: 'bricolage-grotesque-latin-600-normal.woff',
    bolditalics: 'bricolage-grotesque-latin-700-normal.woff'
  }
}
export const PDF_PERMISSIONS = {
  printing: 'highResolution',
  modifying: false,
  copying: false,
  annotating: false,
  fillingForms: false,
  contentAccessibility: true,
  documentAssembly: false
}
export const ISSUED_ACTION = 'report.issued'
export const VERIFY_URL = 'speechomania.com/verify'
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODE_PATTERN = /^SPM-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/
export const REPORT_KINDS = { progress: 'Learning report', cards: 'Flashcards' }
export const ART_NAME = /^[a-z0-9-]+$/
