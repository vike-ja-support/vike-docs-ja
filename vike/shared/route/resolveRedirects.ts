export { resolveRedirects }

// For ./resolveRedirects.spec.ts
export { resolveRouteStringRedirect }

import { assertIsNotBrowser } from '../../utils/assertIsNotBrowser.js'
import { assert, assertUsage, isUriWithProtocol } from '../utils.js'
import { resolveUrlPathname } from './resolveUrlPathname.js'
import { assertRouteString, resolveRouteString } from './resolveRouteString.js'
import pc from '@brillout/picocolors'
assertIsNotBrowser() // Don't bloat the client

// TODO/v1-release: update
const configSrc = '[vite.config.js > vike({ redirects })]'

function resolveRedirects(redirects: Record<string, string>, urlPathname: string): null | string {
  for (const [urlSource, urlTarget] of Object.entries(redirects)) {
    const urlResolved = resolveRouteStringRedirect(urlSource, urlTarget, urlPathname)
    if (urlResolved) return urlResolved
  }
  return null
}

function resolveRouteStringRedirect(urlSource: string, urlTarget: string, urlPathname: string): null | string {
  assertRouteString(urlSource, `${configSrc} Invalid`)
  assertUsage(
    urlTarget.startsWith('/') ||
      // Is allowing any protocol a safety issue? https://github.com/vikejs/vike/pull/1292#issuecomment-1828043917
      isUriWithProtocol(urlTarget) ||
      urlTarget === '*',
    `${configSrc} Invalid redirection target URL ${pc.cyan(urlTarget)}: the target URL should start with ${pc.cyan(
      '/'
    )}, a valid protocol (${pc.cyan('https:')}, ${pc.cyan('http:')}, ${pc.cyan('mailto:')}, ${pc.cyan(
      'ipfs:'
    )}, ${pc.cyan('magnet:')}, ...), or be ${pc.cyan('*')}`
  )
  assertParams(urlSource, urlTarget)
  const match = resolveRouteString(urlSource, urlPathname)
  if (!match) return null
  const urlResolved = resolveUrlPathname(urlTarget, match.routeParams)
  if (urlResolved === urlPathname) return null
  assert(urlResolved.startsWith('/') || isUriWithProtocol(urlResolved))
  return urlResolved
}

function assertParams(urlSource: string, urlTarget: string) {
  const routeSegments = urlTarget.split('/')
  routeSegments.forEach((routeSegment) => {
    if (routeSegment.startsWith('@') || routeSegment.startsWith('*')) {
      const segments = urlSource.split('/')
      assertUsage(
        segments.includes(routeSegment),
        `${configSrc} The redirection source URL ${pc.cyan(urlSource)} is missing the URL parameter ${pc.cyan(
          routeSegment
        )} used by the redirection target URL ${pc.cyan(urlTarget)}`
      )
    }
  })
}
