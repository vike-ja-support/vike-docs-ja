import { parseUrl, isUriWithProtocol } from './parseUrl.js'
import { expect, describe, it } from 'vitest'
import assert from 'assert'

const resultBase = {
  hasBaseServer: true,
  pathnameOriginal: '/',
  pathname: '/',
  hash: '',
  hashOriginal: null,
  origin: null,
  search: {},
  searchAll: {},
  searchOriginal: null
} as const

describe('parseUrl', () => {
  it('basics', () => {
    expect(parseUrl('/', '/')).toEqual(resultBase)
    expect(parseUrl('/hello', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/hello',
      pathname: '/hello'
    })
  })

  it('Base URL', () => {
    expect(parseUrl('/base', '/base')).toEqual({
      ...resultBase,
      pathnameOriginal: '/base'
    })
    expect(parseUrl('/base/', '/base')).toEqual({
      ...resultBase,
      pathnameOriginal: '/base/'
    })
    expect(parseUrl('/base', '/base/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/base'
    })
    expect(parseUrl('https://example.org/base', '/base')).toEqual({
      ...resultBase,
      pathnameOriginal: '/base',
      origin: 'https://example.org'
    })
    expect(parseUrl('https://example.org/base/', '/base')).toEqual({
      ...resultBase,
      pathnameOriginal: '/base/',
      origin: 'https://example.org'
    })
    expect(parseUrl('https://example.org/base', '/base/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/base',
      origin: 'https://example.org'
    })
    expect(parseUrl('/base/hello', '/base')).toEqual({
      ...resultBase,
      pathnameOriginal: '/base/hello',
      pathname: '/hello'
    })
    expect(parseUrl('/hello', '/base')).toEqual({
      ...resultBase,
      hasBaseServer: false,
      pathnameOriginal: '/hello',
      pathname: '/hello'
    })
    expect(parseUrl('/base/hello', '/base/nested')).toEqual({
      ...resultBase,
      hasBaseServer: false,
      pathnameOriginal: '/base/hello',
      pathname: '/base/hello'
    })
  })

  it('origin', () => {
    expect(parseUrl('https://example.org/', '/')).toEqual({
      ...resultBase,
      origin: 'https://example.org'
    })
    expect(parseUrl('http://example.org/', '/')).toEqual({
      ...resultBase,
      origin: 'http://example.org'
    })
    expect(parseUrl('http://example.org', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '',
      origin: 'http://example.org'
    })
    expect(parseUrl('http://example.org/base/hello', '/base')).toEqual({
      ...resultBase,
      pathnameOriginal: '/base/hello',
      pathname: '/hello',
      origin: 'http://example.org'
    })
  })

  it('hash', () => {
    expect(parseUrl('/#reviews', '/')).toEqual({
      ...resultBase,
      hash: 'reviews',
      hashOriginal: '#reviews'
    })
    expect(parseUrl('/#', '/')).toEqual({
      ...resultBase,
      hash: '',
      hashOriginal: '#'
    })
    expect(parseUrl('/', '/')).toEqual({
      ...resultBase,
      hash: '',
      hashOriginal: null
    })
    expect(parseUrl('/a/b#', '/a/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/a/b',
      pathname: '/b',
      hash: '',
      hashOriginal: '#'
    })
  })

  it('search', () => {
    expect(parseUrl('/?q=apples', '/')).toEqual({
      ...resultBase,
      search: { q: 'apples' },
      searchAll: { q: ['apples'] },
      searchOriginal: '?q=apples'
    })
    expect(parseUrl('/shop?fruits=apples&candies=chocolate,lollipop', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/shop',
      pathname: '/shop',
      search: { fruits: 'apples', candies: 'chocolate,lollipop' },
      searchAll: { fruits: ['apples'], candies: ['chocolate,lollipop'] },
      searchOriginal: '?fruits=apples&candies=chocolate,lollipop'
    })
    const searchQuery = '?fruit=apples&fruit=bananas&candy=chocolate&candy=lollipop&constructor=val1&constructor=val2'
    const { searchOriginal } = parseUrl(`/shop${searchQuery}`, '/')
    assert(searchOriginal)
    const searchParams = new URLSearchParams(searchOriginal)
    expect(searchParams.getAll('fruit')).toEqual(['apples', 'bananas'])
    expect(searchParams.getAll('candy')).toEqual(['chocolate', 'lollipop'])
    expect(parseUrl(`/shop${searchQuery}`, '/shop')).toEqual({
      ...resultBase,
      pathnameOriginal: '/shop',
      pathname: '/',
      search: { fruit: 'bananas', candy: 'lollipop', constructor: 'val2' },
      searchAll: {
        fruit: ['apples', 'bananas'],
        candy: ['chocolate', 'lollipop'],
        constructor: ['val1', 'val2']
      },
      searchOriginal: searchQuery
    })
  })

  it('decoding', () => {
    // Pathname
    {
      expect(parseUrl('/user/@rom', '/')).toEqual({
        ...resultBase,
        pathnameOriginal: '/user/@rom',
        pathname: '/user/@rom'
      })
      assert(encodeURIComponent('@') === '%40')
      expect(parseUrl('/user/%40rom', '/')).toEqual({
        ...resultBase,
        pathnameOriginal: '/user/%40rom',
        pathname: '/user/@rom'
      })
      assert(encodeURIComponent('/') === '%2F')
      assert(decodeURIComponent('%2F') === '/')
      assert(decodeURI('%2F') === '%2F')
      expect(parseUrl(`/r${encodeURIComponent('/')}om`, '/')).toEqual({
        ...resultBase,
        pathnameOriginal: '/r%2Fom',
        pathname: '/r%2Fom'
      })
    }

    // Hash
    {
      expect(parseUrl('/#@reviews', '/')).toEqual({
        ...resultBase,
        hash: '@reviews',
        hashOriginal: '#@reviews'
      })
      assert(encodeURIComponent('@') === '%40')
      expect(parseUrl(`/#%40reviews`, '/')).toEqual({
        ...resultBase,
        hash: '@reviews',
        hashOriginal: '#%40reviews'
      })
    }

    // Search
    {
      expect(parseUrl('/?section=@reviews', '/')).toEqual({
        ...resultBase,
        search: { section: '@reviews' },
        searchAll: { section: ['@reviews'] },
        searchOriginal: '?section=@reviews'
      })
      assert(encodeURIComponent('@') === '%40')
      expect(parseUrl(`/?section=%40reviews`, '/')).toEqual({
        ...resultBase,
        search: { section: '@reviews' },
        searchAll: { section: ['@reviews'] },
        searchOriginal: '?section=%40reviews'
      })
    }

    // #291
    {
      try {
        decodeURI(decodeURI(encodeURI('%')))
        assert(false)
      } catch (err) {
        assert((err as Error).message === 'URI malformed')
      }
      assert(encodeURIComponent('%') === '%25')
      expect(parseUrl('/user/%25rom', '/')).toEqual({
        ...resultBase,
        pathnameOriginal: '/user/%25rom',
        pathname: '/user/%rom'
      })
      expect(parseUrl('/user/%rom', '/')).toEqual({
        ...resultBase,
        pathnameOriginal: '/user/%rom',
        pathname: '/user/%rom'
      })
    }
  })

  it('edge cases', () => {
    expect(parseUrl('/product/ö', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/product/ö',
      pathname: '/product/ö'
    })
    expect(parseUrl('/product/%C3%B6', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/product/%C3%B6',
      pathname: '/product/ö'
    })
    expect(parseUrl('/product/แจ็คเก็ตเดนิม', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/product/แจ็คเก็ตเดนิม',
      pathname: '/product/แจ็คเก็ตเดนิม'
    })

    // #322
    // Remove trailing white space
    expect(parseUrl('/ab ', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/ab ',
      pathname: '/ab'
    })
    // Preserve whitespace otherwise
    assert(encodeURIComponent(' ') === '%20')
    expect(parseUrl('/ab%20', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/ab%20',
      pathname: '/ab '
    })
    expect(parseUrl('/a b', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/a b',
      pathname: '/a b'
    })
    expect(parseUrl('/a%20b', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/a%20b',
      pathname: '/a b'
    })

    assert(encodeURIComponent('#') === '%23')
    assert(encodeURIComponent('?') === '%3F')
    expect(parseUrl('/a%23/b%3Fc', '/a%23')).toEqual({
      ...resultBase,
      pathnameOriginal: '/a%23/b%3Fc',
      pathname: '/b?c'
    })
    /* Bug, this doesn't work:
    expect(parseUrl('/a%23/b%3Fc', '/a#')).toEqual({
      ...resultBase,
      pathnameOriginal: '/a%23/b%3Fc',
      pathname: '/b?c',
    })
    */

    expect(parseUrl('/a//b', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '/a//b',
      pathname: '/a//b'
    })
    expect(parseUrl('http://example.org//', '/')).toEqual({
      ...resultBase,
      origin: 'http://example.org',
      pathnameOriginal: '//',
      pathname: '//'
    })
    expect(parseUrl('//', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '//',
      pathname: '//'
    })
    expect(parseUrl('///', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '///',
      pathname: '///'
    })

    // #495
    expect(parseUrl('///en/?redirect_zone=ru', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '///en/',
      pathname: '///en/',
      search: { redirect_zone: 'ru' },
      searchAll: { redirect_zone: ['ru'] },
      searchOriginal: '?redirect_zone=ru'
    })
  })

  it('missing pathname', () => {
    expect(parseUrl('?a=b', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '',
      search: { a: 'b' },
      searchAll: { a: ['b'] },
      searchOriginal: '?a=b'
    })
    expect(parseUrl('#a', '/')).toEqual({
      ...resultBase,
      hash: 'a',
      hashOriginal: '#a',
      pathnameOriginal: ''
    })
    expect(parseUrl('', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '',
      pathname: '/'
    })
    assert(new URL('', 'http://fake.org/base').pathname === '/base')
    expect(parseUrl('', '/base')).toEqual({
      ...resultBase,
      pathnameOriginal: '',
      pathname: '/'
    })
  })

  it('doc example', () => {
    expect(
      parseUrl(
        'https://example.com/some-base-url/hello/s%C3%A9bastien?fruit=%C3%A2pple&fruit=orânge#%C3%A2ge',
        '/some-base-url'
      )
    ).toEqual({
      hasBaseServer: true,
      origin: 'https://example.com',
      pathname: '/hello/sébastien',
      pathnameOriginal: '/some-base-url/hello/s%C3%A9bastien',
      search: { fruit: 'orânge' },
      searchAll: { fruit: ['âpple', 'orânge'] },
      searchOriginal: '?fruit=%C3%A2pple&fruit=orânge',
      hash: 'âge',
      hashOriginal: '#%C3%A2ge'
    })
  })

  it('tauri', () => {
    expect(parseUrl('tauri://localhost/', '/')).toEqual({
      ...resultBase,
      origin: 'tauri://localhost'
    })
    expect(parseUrl('tauri://localhost', '/')).toEqual({
      ...resultBase,
      origin: 'tauri://localhost',
      pathnameOriginal: ''
    })
    expect(parseUrl('tauri://localhost/somePath', '/')).toEqual({
      ...resultBase,
      origin: 'tauri://localhost',
      pathname: '/somePath',
      pathnameOriginal: '/somePath'
    })
  })

  it('relative paths', () => {
    expect(parseUrl('.', '/b1/b2/')).toEqual({
      ...resultBase,
      pathnameOriginal: '.',
      pathname: '/'
    })
    expect(parseUrl('..', '/b1/b2/')).toEqual({
      ...resultBase,
      hasBaseServer: false,
      pathnameOriginal: '..',
      pathname: '/b1/'
    })
    expect(parseUrl('../../', '/b1/b2/')).toEqual({
      ...resultBase,
      hasBaseServer: false,
      pathnameOriginal: '../../',
      pathname: '/'
    })
    expect(parseUrl('./markdown', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: './markdown',
      pathname: '/markdown'
    })
  })
  it('relative paths - browser-side', () => {
    // @ts-ignore
    globalThis.window = { document: { baseURI: 'http://100.115.92.194:3000/?q=any' } }
    expect(parseUrl('?q=any', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '',
      search: { q: 'any' },
      searchAll: { q: ['any'] },
      searchOriginal: '?q=any'
    })
    // @ts-ignore
    globalThis.window = { document: { baseURI: 'http://localhost:3000/' } }
    expect(parseUrl('./markdown', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: './markdown',
      pathname: '/markdown'
    })
    // @ts-ignore
    globalThis.window = { document: { baseURI: 'http://localhost:3000/some/deep/path' } }
    expect(parseUrl('./markdown', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: './markdown',
      pathname: '/some/deep/markdown'
    })
    // @ts-ignore
    globalThis.window = { document: { baseURI: 'http://localhost:3000/some/deep/' } }
    expect(parseUrl('..//bla', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '..//bla',
      pathname: '/some//bla'
    })
    // @ts-ignore
    globalThis.window = { document: { baseURI: 'http://localhost:3000/some/very/deep/' } }
    expect(parseUrl('../../../../bla', '/')).toEqual({
      ...resultBase,
      pathnameOriginal: '../../../../bla',
      pathname: '/bla'
    })
    // @ts-ignore
    globalThis.window = undefined
  })
})
/* Doesn't work
declare global {
  var document: Document & { baseURI: string }
}
*/

describe('isUriWithProtocol()', () => {
  it('works', () => {
    // Basics
    expect(isUriWithProtocol('/bla')).toBe(false)
    expect(isUriWithProtocol('/bla:')).toBe(false)
    expect(isUriWithProtocol('bla:')).toBe(true)

    // Valid
    expect(isUriWithProtocol('a:')).toBe(true)
    expect(isUriWithProtocol('a-b:')).toBe(true)
    expect(isUriWithProtocol('a+b:')).toBe(true)
    expect(isUriWithProtocol('a.b:')).toBe(true)
    expect(isUriWithProtocol('a2:')).toBe(true)
    expect(isUriWithProtocol('2a:')).toBe(true)

    // Invalid
    expect(isUriWithProtocol('a!b:')).toBe(false)
    expect(isUriWithProtocol('a_b:')).toBe(false)
    expect(isUriWithProtocol('.ab:')).toBe(false)
  })
})
