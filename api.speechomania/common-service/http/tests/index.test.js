import { describe, expect, test } from 'bun:test'
import { HttpError, forbidden, invalidFields, notFound, tooManyRequests } from '../exception/index.js'
import { json, likePattern, pageArray, pageMeta } from '../utils/index.js'
import { pageQuery } from '../validation/index.js'
import Joi from 'joi'

describe('http utils', () => {
  test('pageMeta always reports at least one page', () => {
    expect(pageMeta(0, { page: 1, page_size: 25 })).toEqual({ page: 1, page_size: 25, total: 0, total_pages: 1 })
    expect(pageMeta(51, { page: 2, page_size: 25 }).total_pages).toBe(3)
  })

  test('pageArray slices the requested window', () => {
    const all = Array.from({ length: 7 }, (_, index) => index)
    expect(pageArray(all, { page: 2, page_size: 3 })).toEqual({ items: [3, 4, 5], page: 2, page_size: 3, total: 7, total_pages: 3 })
  })

  test('likePattern escapes wildcards', () => {
    expect(likePattern('50%_a\\b')).toBe('%50\\%\\_a\\\\b%')
  })

  test('json sends undefined as null', () => {
    expect(json(undefined)).toBe('null')
    expect(json({ a: 1 })).toBe('{"a":1}')
  })

  test('pageQuery defaults and caps the page size', () => {
    const schema = Joi.object(pageQuery)
    expect(schema.validate({}).value).toEqual({ page: 1, page_size: 25 })
    expect(schema.validate({ page_size: 101 }).error).toBeDefined()
  })
})

describe('http exceptions', () => {
  test('factories carry the right status', () => {
    expect(notFound('Child')).toMatchObject({ status: 404, message: 'Child not found' })
    expect(forbidden().status).toBe(403)
    expect(tooManyRequests().status).toBe(429)
    expect(invalidFields([{ field: 'a' }])).toMatchObject({ status: 400, details: [{ field: 'a' }] })
    expect(notFound()).toBeInstanceOf(HttpError)
  })
})
