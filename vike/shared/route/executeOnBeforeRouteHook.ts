export { executeOnBeforeRouteHook }

import { assertPageContextProvidedByUser } from '../assertPageContextProvidedByUser.js'
import {
  assertUsage,
  hasProp,
  isObjectWithKeys,
  objectAssign,
  assertWarning,
  assertUsageUrl,
  joinEnglish,
  assert
} from './utils.js'
import { assertRouteParams, assertSyncRouting } from './resolveRouteFunction.js'
import pc from '@brillout/picocolors'
import type { PageContextForRoute, PageContextFromRoute } from './index.js'
import type { Hook } from '../hooks/getHook.js'
import { executeHook } from '../hooks/executeHook.js'

async function executeOnBeforeRouteHook(
  pageContext: PageContextForRoute
): Promise<
  | null
  | ({ _routingProvidedByOnBeforeRouteHook: true } & PageContextFromRoute)
  | { _routingProvidedByOnBeforeRouteHook: false }
> {
  const pageContextFromOnBeforeRouteHook = {}
  if (!pageContext._onBeforeRouteHook) return null
  const pageContextFromHook = await getPageContextFromHook(pageContext._onBeforeRouteHook, pageContext)
  if (pageContextFromHook) {
    objectAssign(pageContextFromOnBeforeRouteHook, pageContextFromHook)
    if (
      hasProp(pageContextFromOnBeforeRouteHook, '_pageId', 'string') ||
      hasProp(pageContextFromOnBeforeRouteHook, '_pageId', 'null')
    ) {
      // We bypass Vike's routing
      if (!hasProp(pageContextFromOnBeforeRouteHook, 'routeParams')) {
        objectAssign(pageContextFromOnBeforeRouteHook, { routeParams: {} })
      } else {
        assert(hasProp(pageContextFromOnBeforeRouteHook, 'routeParams', 'object'))
      }
      objectAssign(pageContextFromOnBeforeRouteHook, {
        _routingProvidedByOnBeforeRouteHook: true as const,
        _debugRouteMatches: 'CUSTOM_ROUTING' as const
      })
      return pageContextFromOnBeforeRouteHook
    }
  }
  objectAssign(pageContextFromOnBeforeRouteHook, {
    _routingProvidedByOnBeforeRouteHook: false as const
  })
  return pageContextFromOnBeforeRouteHook
}

async function getPageContextFromHook(
  onBeforeRouteHook: Hook,
  pageContext: {
    urlOriginal: string
    _allPageIds: string[]
  }
): Promise<null | {
  urlOriginal?: string
  urlLogical?: string
  _pageId?: string | null
  routeParams?: Record<string, string>
}> {
  let hookReturn: unknown = onBeforeRouteHook.hookFn(pageContext)
  assertSyncRouting(hookReturn, `The onBeforeRoute() hook ${onBeforeRouteHook.hookFilePath}`)
  // TODO/v1-release: make executeOnBeforeRouteHook() and route() sync
  hookReturn = await executeHook(() => hookReturn, onBeforeRouteHook)

  const errPrefix = `The onBeforeRoute() hook defined by ${onBeforeRouteHook.hookFilePath}`

  assertUsage(
    hookReturn === null ||
      hookReturn === undefined ||
      (isObjectWithKeys(hookReturn, ['pageContext'] as const) && hasProp(hookReturn, 'pageContext')),
    `${errPrefix} should return ${pc.cyan('null')}, ${pc.cyan('undefined')}, or a plain JavaScript object ${pc.cyan(
      '{ pageContext: { /* ... */ } }'
    )}`
  )

  if (hookReturn === null || hookReturn === undefined) {
    return null
  }

  assertUsage(
    hasProp(hookReturn, 'pageContext', 'object'),
    `${errPrefix} returned ${pc.cyan('{ pageContext }')} but pageContext should be a plain JavaScript object.`
  )

  if (hasProp(hookReturn.pageContext, '_pageId') && !hasProp(hookReturn.pageContext, '_pageId', 'null')) {
    const errPrefix2 = `${errPrefix} returned ${pc.cyan('{ pageContext: { _pageId } }')} but ${pc.cyan(
      '_pageId'
    )} should be` as const
    assertUsage(hasProp(hookReturn.pageContext, '_pageId', 'string'), `${errPrefix2} a string or null`)
    assertUsage(
      pageContext._allPageIds.includes(hookReturn.pageContext._pageId),
      `${errPrefix2} ${joinEnglish(
        pageContext._allPageIds.map((s) => pc.cyan(s)),
        'or'
      )}`
    )
  }
  if (hasProp(hookReturn.pageContext, 'routeParams')) {
    assertRouteParams(
      hookReturn.pageContext,
      `${errPrefix} returned ${pc.cyan('{ pageContext: { routeParams } }')} but routeParams should`
    )
  }

  const deprecatedReturn = (prop: 'url' | 'urlOriginal') =>
    `${errPrefix} returned ${pc.cyan(`{ pageContext: { ${prop} } }`)} which is deprecated. Return ${pc.cyan(
      '{ pageContext: { urlLogical } }'
    )} instead.`

  if (hasProp(hookReturn.pageContext, 'url')) {
    assertWarning(false, deprecatedReturn('url'), { onlyOnce: true })
    hookReturn.pageContext.urlLogical = hookReturn.pageContext.url
    delete hookReturn.pageContext.url
  }
  if (hasProp(hookReturn.pageContext, 'urlOriginal')) {
    assertWarning(false, deprecatedReturn('urlOriginal'), { onlyOnce: true })
    hookReturn.pageContext.urlLogical = hookReturn.pageContext.urlOriginal
    delete hookReturn.pageContext.urlOriginal
  }

  if (hasProp(hookReturn.pageContext, 'urlLogical')) {
    assertUsageUrl(
      hookReturn.pageContext.urlLogical,
      `${errPrefix} returned ${pc.cyan('{ pageContext: { urlLogical } }')} but ${pc.cyan('urlLogical')}`
    )
  }

  assertPageContextProvidedByUser(hookReturn.pageContext, {
    hookFilePath: onBeforeRouteHook.hookFilePath,
    hookName: 'onBeforeRoute'
  })

  const pageContextAddendumHook = {}
  objectAssign(pageContextAddendumHook, hookReturn.pageContext)
  return pageContextAddendumHook
}
