export { render }
export { passToClient }

import React from 'react'
import { renderToString } from 'react-dom/server'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import { PageShell } from './PageShell'

// See https://vike.dev/data-fetching
const passToClient = ['pageProps', 'routeParams']

async function render(pageContext) {
  const { Page, pageProps } = pageContext

  const pageHtml = renderToString(
    <PageShell pageContext={pageContext}>
      <Page {...pageProps} />
    </PageShell>
  )

  return escapeInject`<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <div id="react-root">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`
}
