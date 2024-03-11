import { renderToString } from '@vue/server-renderer'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import { createApp } from './app'
import logoUrl from './logo.svg'

export { render }
export { onBeforeRender }
// See https://vike.dev/data-fetching
export const passToClient = ['pageProps', 'urlPathname', 'apolloInitialState']

async function render(pageContext) {
  // See https://vike.dev/head
  const { documentProps } = pageContext
  const title = (documentProps && documentProps.title) || 'Vite SSR app'
  const desc = (documentProps && documentProps.description) || 'App using Vite + Vike'

  const { appHtml } = pageContext

  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" href="${logoUrl}" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${desc}" />
        <title>${title}</title>
      </head>
      <body>
        <div id="app">${dangerouslySkipEscape(appHtml)}</div>
      </body>
    </html>`

  return {
    documentHtml,
    pageContext: {
      // We can add some `pageContext` here, which is useful if we want to do page redirection https://vike.dev/page-redirection
    }
  }
}

async function onBeforeRender(pageContext) {
  const app = createApp(pageContext, pageContext.apolloClient)
  const appHtml = await renderToString(app)
  const apolloInitialState = pageContext.apolloClient.extract()
  return {
    pageContext: {
      apolloInitialState,
      appHtml
    }
  }
}
