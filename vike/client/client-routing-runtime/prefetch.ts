export { prefetch }
export { addLinkPrefetchHandlers }

import {
  assert,
  assertClientRouting,
  assertUsage,
  assertWarning,
  checkIfClientRouting,
  getGlobalObject,
  isExternalLink
} from './utils.js'
import {
  type PageContextUserFiles,
  isErrorFetchingStaticAssets,
  loadUserFilesClientSide
} from '../shared/loadUserFilesClientSide.js'
import { skipLink } from './skipLink.js'
import { getPrefetchSettings } from './prefetch/getPrefetchSettings.js'
import { isAlreadyPrefetched, markAsAlreadyPrefetched } from './prefetch/alreadyPrefetched.js'
import { disableClientRouting } from './renderPageClientSide.js'
import { isClientSideRoutable } from './isClientSideRoutable.js'
import { createPageContext } from './createPageContext.js'
import { route, type PageContextFromRoute } from '../../shared/route/index.js'
import { noRouteMatch } from '../../shared/route/noRouteMatch.js'

assertClientRouting()
const globalObject = getGlobalObject<{
  linkPrefetchHandlerAdded: WeakMap<HTMLElement, true>
}>('prefetch.ts', { linkPrefetchHandlerAdded: new WeakMap() })

async function prefetchAssets(pageId: string, pageContext: PageContextUserFiles): Promise<void> {
  try {
    await loadUserFilesClientSide(pageId, pageContext._pageFilesAll, pageContext._pageConfigs)
  } catch (err) {
    if (isErrorFetchingStaticAssets(err)) {
      disableClientRouting(err, true)
    } else {
      throw err
    }
  }
}

/**
 * Programmatically prefetch client assets.
 *
 * https://vike.dev/prefetch
 *
 * @param url - The URL of the page you want to prefetch.
 */
async function prefetch(url: string): Promise<void> {
  assertUsage(checkIfClientRouting(), 'prefetch() only works with Client Routing, see https://vike.dev/prefetch', {
    showStackTrace: true
  })
  const errPrefix = `Cannot prefetch URL ${url} because it` as const
  assertUsage(!isExternalLink(url), `${errPrefix} lives on another domain`, { showStackTrace: true })

  if (isAlreadyPrefetched(url)) return
  markAsAlreadyPrefetched(url)

  const pageContext = await createPageContext(url)
  let pageContextFromRoute: PageContextFromRoute
  try {
    pageContextFromRoute = await route(pageContext)
  } catch {
    // If a route() hook has a bug or `throw render()` / `throw redirect()`
    return
  }
  const pageId = pageContextFromRoute._pageId

  if (!pageId) {
    assertWarning(false, `${errPrefix} ${noRouteMatch}`, {
      showStackTrace: true,
      onlyOnce: false
    })
    return
  }

  await prefetchAssets(pageId, pageContext)
}

function addLinkPrefetchHandlers(pageContext: { exports: Record<string, unknown>; urlPathname: string }) {
  // Current URL is already prefetched
  markAsAlreadyPrefetched(pageContext.urlPathname)

  const linkTags = [...document.getElementsByTagName('A')] as HTMLElement[]
  linkTags.forEach((linkTag) => {
    if (globalObject.linkPrefetchHandlerAdded.has(linkTag)) return
    globalObject.linkPrefetchHandlerAdded.set(linkTag, true)

    const url = linkTag.getAttribute('href')

    if (skipLink(linkTag)) return
    assert(url)

    if (isAlreadyPrefetched(url)) return

    const { prefetchStaticAssets } = getPrefetchSettings(pageContext, linkTag)
    if (!prefetchStaticAssets) return

    if (prefetchStaticAssets === 'hover') {
      linkTag.addEventListener('mouseover', () => {
        prefetchIfPossible(url)
      })
      linkTag.addEventListener(
        'touchstart',
        () => {
          prefetchIfPossible(url)
        },
        { passive: true }
      )
    }

    if (prefetchStaticAssets === 'viewport') {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetchIfPossible(url)
            observer.disconnect()
          }
        })
      })
      observer.observe(linkTag)
    }
  })
}

async function prefetchIfPossible(url: string): Promise<void> {
  const pageContext = await createPageContext(url)
  let pageContextFromRoute: PageContextFromRoute
  try {
    pageContextFromRoute = await route(pageContext)
  } catch {
    // If a route() hook has a bug or `throw render()` / `throw redirect()`
    return
  }
  if (!pageContextFromRoute?._pageId) return
  if (!(await isClientSideRoutable(pageContextFromRoute._pageId, pageContext))) return
  await prefetchAssets(pageContextFromRoute._pageId, pageContext)
}
