export { loadPageRoutes }
export type { PageRoutes }
export type { RouteType }

import type { PageFile } from '../getPageFiles.js'
import { isErrorPageId } from '../error-page.js'
import { assert, assertUsage, hasProp, slice } from './utils.js'
import { FilesystemRoot, deduceRouteStringFromFilesystemPath } from './deduceRouteStringFromFilesystemPath.js'
import { isCallable } from '../utils.js'
import type { PageConfigRuntime, PageConfigGlobalRuntime } from '../page-configs/PageConfig.js'
import { getConfigValue, getDefinedAtString } from '../page-configs/helpers.js'
import { warnDeprecatedAllowKey } from './resolveRouteFunction.js'
import { getHookFromPageConfigGlobal, getHookTimeoutDefault, type Hook } from '../hooks/getHook.js'

type PageRoute = {
  pageId: string
  comesFromV1PageConfig: boolean
} & (
  | { routeString: string; routeDefinedAt: null; routeType: 'FILESYSTEM'; routeFilesystemDefinedBy: string }
  | { routeString: string; routeDefinedAt: string; routeType: 'STRING' }
  | { routeFunction: Function; routeDefinedAt: string; routeType: 'FUNCTION' }
)
type PageRoutes = PageRoute[]
type RouteType = 'STRING' | 'FUNCTION' | 'FILESYSTEM'

async function loadPageRoutes(
  // Remove all arguments and use GlobalContext instead?
  pageFilesAll: PageFile[],
  pageConfigs: PageConfigRuntime[],
  pageConfigGlobal: PageConfigGlobalRuntime,
  allPageIds: string[]
): Promise<{ pageRoutes: PageRoutes; onBeforeRouteHook: null | Hook }> {
  await Promise.all(pageFilesAll.filter((p) => p.fileType === '.page.route').map((p) => p.loadFile?.()))
  const { onBeforeRouteHook, filesystemRoots } = getGlobalHooks(pageFilesAll, pageConfigs, pageConfigGlobal)
  const pageRoutes = getPageRoutes(filesystemRoots, pageFilesAll, pageConfigs, allPageIds)
  return { pageRoutes, onBeforeRouteHook }
}

function getPageRoutes(
  filesystemRoots: null | FilesystemRoot[],
  pageFilesAll: PageFile[],
  pageConfigs: PageConfigRuntime[],
  allPageIds: string[]
): PageRoutes {
  const pageRoutes: PageRoutes = []

  // V1 Design
  if (pageConfigs.length > 0) {
    assert(filesystemRoots === null)
    const comesFromV1PageConfig = true
    pageConfigs
      .filter((p) => !p.isErrorPage)
      .forEach((pageConfig) => {
        const pageId = pageConfig.pageId

        let pageRoute: null | PageRoute = null
        {
          const configName = 'route'
          const configValue = getConfigValue(pageConfig, configName)
          if (configValue) {
            const route = configValue.value
            const definedAt = getDefinedAtString(configValue.definedAt, configName)
            if (typeof route === 'string') {
              pageRoute = {
                pageId,
                comesFromV1PageConfig,
                routeString: route,
                routeDefinedAt: definedAt,
                routeType: 'STRING'
              }
            } else {
              assert(isCallable(route))
              if (getConfigValue(pageConfig, 'iKnowThePerformanceRisksOfAsyncRouteFunctions', 'boolean'))
                warnDeprecatedAllowKey()
              pageRoute = {
                pageId,
                comesFromV1PageConfig,
                routeFunction: route,
                routeDefinedAt: definedAt,
                routeType: 'FUNCTION'
              }
            }
          }
        }

        if (!pageRoute) {
          const { routeFilesystem } = pageConfig
          assert(routeFilesystem)
          const { routeString, definedBy } = routeFilesystem
          assert(routeFilesystem.routeString.startsWith('/'))
          pageRoute = {
            pageId,
            routeFilesystemDefinedBy: definedBy,
            comesFromV1PageConfig,
            routeString,
            routeDefinedAt: null,
            routeType: 'FILESYSTEM'
          }
        }

        assert(pageRoute)
        pageRoutes.push(pageRoute)
      })
  }

  // Old design
  // TODO/v1-release: remove
  if (pageConfigs.length === 0) {
    assert(filesystemRoots)
    const comesFromV1PageConfig = false
    allPageIds
      .filter((pageId) => !isErrorPageId(pageId, false))
      .forEach((pageId) => {
        const pageRouteFile = pageFilesAll.find((p) => p.pageId === pageId && p.fileType === '.page.route')
        if (!pageRouteFile || !('default' in pageRouteFile.fileExports!)) {
          const routeString = deduceRouteStringFromFilesystemPath(pageId, filesystemRoots)
          assert(routeString.startsWith('/'))
          assert(!routeString.endsWith('/') || routeString === '/')
          pageRoutes.push({
            pageId,
            comesFromV1PageConfig,
            routeString,
            routeDefinedAt: null,
            routeFilesystemDefinedBy: `${pageId}.page.*`,
            routeType: 'FILESYSTEM'
          })
        } else {
          const { filePath, fileExports } = pageRouteFile
          assert(fileExports.default)
          if (hasProp(fileExports, 'default', 'string')) {
            const routeString = fileExports.default
            assertUsage(
              routeString.startsWith('/'),
              `A Route String should start with a leading slash '/' but ${filePath} has \`export default '${routeString}'\`. Make sure to \`export default '/${routeString}'\` instead.`
            )
            pageRoutes.push({
              pageId,
              comesFromV1PageConfig,
              routeString,
              routeDefinedAt: filePath,
              routeType: 'STRING'
            })
            return
          }
          if (hasProp(fileExports, 'default', 'function')) {
            const routeFunction = fileExports.default
            {
              const allowKey = 'iKnowThePerformanceRisksOfAsyncRouteFunctions'
              if (allowKey in fileExports) {
                warnDeprecatedAllowKey()
              }
            }
            pageRoutes.push({
              pageId,
              comesFromV1PageConfig,
              routeFunction,
              routeDefinedAt: filePath,
              routeType: 'FUNCTION'
            })
            return
          }
          assertUsage(false, `The default export of ${filePath} should be a string or a function.`)
        }
      })
  }

  return pageRoutes
}

function getGlobalHooks(
  pageFilesAll: PageFile[],
  pageConfigs: PageConfigRuntime[],
  pageConfigGlobal: PageConfigGlobalRuntime
): {
  onBeforeRouteHook: null | Hook
  filesystemRoots: null | FilesystemRoot[]
} {
  // V1 Design
  if (pageConfigs.length > 0) {
    const hook = getHookFromPageConfigGlobal(pageConfigGlobal, 'onBeforeRoute')
    return { onBeforeRouteHook: hook, filesystemRoots: null }
  }

  // Old design
  // TODO/v1-release: remove
  let onBeforeRouteHook: null | Hook = null
  const filesystemRoots: FilesystemRoot[] = []
  pageFilesAll
    .filter((p) => p.fileType === '.page.route' && p.isDefaultPageFile)
    .forEach(({ filePath, fileExports }) => {
      assert(fileExports)
      if ('onBeforeRoute' in fileExports) {
        assertUsage(
          hasProp(fileExports, 'onBeforeRoute', 'function'),
          `\`export { onBeforeRoute }\` of ${filePath} should be a function.`
        )
        const { onBeforeRoute } = fileExports
        const hookName = 'onBeforeRoute'
        onBeforeRouteHook = {
          hookFilePath: filePath,
          hookFn: onBeforeRoute,
          hookName,
          hookTimeout: getHookTimeoutDefault(hookName)
        }
      }
      if ('filesystemRoutingRoot' in fileExports) {
        assertUsage(
          hasProp(fileExports, 'filesystemRoutingRoot', 'string'),
          `\`export { filesystemRoutingRoot }\` of ${filePath} should be a string.`
        )
        assertUsage(
          hasProp(fileExports, 'filesystemRoutingRoot', 'string'),
          `\`export { filesystemRoutingRoot }\` of ${filePath} is \`'${fileExports.filesystemRoutingRoot}'\` but it should start with a leading slash \`/\`.`
        )
        filesystemRoots.push({
          filesystemRoot: dirname(filePath),
          urlRoot: fileExports.filesystemRoutingRoot
        })
      }
    })

  return { onBeforeRouteHook, filesystemRoots }
}

function dirname(filePath: string): string {
  assert(filePath.startsWith('/'))
  assert(!filePath.endsWith('/'))
  const paths = filePath.split('/')
  const dirPath = slice(paths, 0, -1).join('/') || '/'
  assert(dirPath.startsWith('/'))
  assert(!dirPath.endsWith('/') || dirPath === '/')
  return dirPath
}
