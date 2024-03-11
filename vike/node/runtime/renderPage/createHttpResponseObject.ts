export { createHttpResponseObject }
export { createHttpResponsePageContextJson }
export { createHttpResponseObjectRedirect }
export type { HttpResponse }

import type { GetPageAssets } from './getPageAssets.js'
import { assert, assertWarning } from '../utils.js'
import type { HtmlRender } from '../html/renderHtml.js'
import type { PageConfigRuntime } from '../../../shared/page-configs/PageConfig.js'
import { isErrorPage } from '../../../shared/error-page.js'
import type { RenderHook } from './executeOnRenderHtmlHook.js'
import type { RedirectStatusCode, AbortStatusCode, UrlRedirect } from '../../../shared/route/abort.js'
import { getHttpResponseBody, getHttpResponseBodyStreamHandlers, HttpResponseBody } from './getHttpResponseBody.js'
import { getEarlyHints, type EarlyHint } from './getEarlyHints.js'
import { getCacheControl } from './createHttpResponseObject/getCacheControl.js'
import { assertNoInfiniteHttpRedirect } from './createHttpResponseObject/assertNoInfiniteHttpRedirect.js'

type HttpResponse = {
  statusCode: 200 | 404 | 500 | RedirectStatusCode | AbortStatusCode
  headers: [string, string][]
  earlyHints: EarlyHint[]
  // We don't use @deprecated to avoid TypeScript to remove the JSDoc
  /** **Deprecated**: use `headers` instead, see https://vike.dev/migration/0.4.134 */
  contentType: 'application/json' | 'text/html;charset=utf-8'
} & HttpResponseBody

// Trick to improve TypeScript DX
type StatusCode = HttpResponse['statusCode']
type ContentType = HttpResponse['contentType']
type ResponseHeaders = HttpResponse['headers']

async function createHttpResponseObject(
  htmlRender: null | HtmlRender,
  renderHook: null | RenderHook,
  pageContext: {
    _pageId: null | string
    is404: null | boolean
    errorWhileRendering: null | Error
    __getPageAssets: GetPageAssets
    _pageConfigs: PageConfigRuntime[]
    abortStatusCode?: AbortStatusCode
  }
): Promise<HttpResponse | null> {
  if (htmlRender === null) {
    return null
  }

  let statusCode: StatusCode | undefined = pageContext.abortStatusCode
  if (!statusCode) {
    const isError = !pageContext._pageId || isErrorPage(pageContext._pageId, pageContext._pageConfigs)
    if (pageContext.errorWhileRendering) {
      assert(isError)
    }
    if (!isError) {
      assert(pageContext.is404 === null)
      statusCode = 200
    } else {
      assert(pageContext.is404 === true || pageContext.is404 === false)
      statusCode = pageContext.is404 ? 404 : 500
    }
  }

  const earlyHints = getEarlyHints(await pageContext.__getPageAssets())

  const headers: ResponseHeaders = []
  assert(pageContext._pageId)
  const cacheControl = getCacheControl(pageContext._pageId, pageContext._pageConfigs)
  if (cacheControl) {
    headers.push(['Cache-Control', cacheControl])
  }

  return getHttpResponse(statusCode, 'text/html;charset=utf-8', headers, htmlRender, earlyHints, renderHook)
}

async function createHttpResponsePageContextJson(pageContextSerialized: string) {
  const httpResponse = getHttpResponse(200, 'application/json', [], pageContextSerialized, [], null)
  return httpResponse
}

function createHttpResponseObjectRedirect(
  { url, statusCode }: UrlRedirect,
  // The URL we assume the redirect to be logically based on
  urlLogical: string
): HttpResponse {
  assertNoInfiniteHttpRedirect(url, urlLogical)
  assert(url)
  assert(statusCode)
  assert(300 <= statusCode && statusCode <= 399)
  const headers: ResponseHeaders = [['Location', url]]
  return getHttpResponse(
    statusCode,
    'text/html;charset=utf-8',
    headers,
    // For bots / programmatic crawlig: show what's going on.
    // For users: showing a blank page is probably better than a flickering text.
    `<p style="display: none">Redirecting to ${url}</p>`
  )
}

function getHttpResponse(
  statusCode: StatusCode,
  contentType: ContentType,
  headers: ResponseHeaders,
  htmlRender: HtmlRender,
  earlyHints: EarlyHint[] = [],
  renderHook: null | RenderHook = null
): HttpResponse {
  headers.push(['Content-Type', contentType])

  assert(renderHook || typeof htmlRender === 'string')
  return {
    statusCode,
    headers,
    // TODO/v1-release: remove
    get contentType() {
      assertWarning(
        false,
        'pageContext.httpResponse.contentType is deprecated and will be removed in the next major release. Use pageContext.httpResponse.headers instead, see https://vike.dev/migration/0.4.134',
        { onlyOnce: true }
      )
      return contentType
    },
    earlyHints,
    get body() {
      return getHttpResponseBody(htmlRender, renderHook)
    },
    ...getHttpResponseBodyStreamHandlers(htmlRender, renderHook)
  }
}
