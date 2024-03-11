import { stabilizeHashs } from './stabilizeHashs'

import { expect, describe, it } from 'vitest'
describe('preload tags', () => {
  it('Default preload strategy', async () => {
    expect(stabilizeHashs('/assets/_default.page.client.81bbaf22.js')).toBe('/assets/_default.page.client.$HASH.js')
    expect(stabilizeHashs('/assets/_default.page.client.81bbaf22.css')).toBe('/assets/_default.page.client.$HASH.css')
    expect(stabilizeHashs('/assets/chunks/chunk-87271e60.js')).toBe('/assets/chunks/chunk-$HASH.js')
    expect(stabilizeHashs('/assets/entries/pages_index.uEHwyP1_.js')).toBe('/assets/entries/pages_index.$HASH.js')
    expect(stabilizeHashs('/assets/entries/pages_index.uEHwyP1-.js')).toBe('/assets/entries/pages_index.$HASH.js')
  })
})
