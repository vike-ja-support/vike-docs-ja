export type { PageConfigRuntime }
export type { PageConfigRuntimeLoaded }
export type { PageConfigBuildTime }
export type { ConfigEnv }
export type { ConfigEnvInternal }
export type { PageConfigGlobalRuntime }
export type { PageConfigGlobalBuildTime }
export type { ConfigValue }
export type { ConfigValues }
export type { ConfigValueSource }
export type { ConfigValueSources }
export type { ConfigValueComputed }
export type { ConfigValuesComputed }
export type { DefinedAt }
export type { DefinedAtFile }
export type { DefinedAtFileFullInfo }
export type { FilePathResolved }
export type { FilePath }

import type { ConfigValueImported, ConfigValueSerialized } from './serialize/PageConfigSerialized.js'
import type { LocationId } from '../../node/plugin/plugins/importUserCode/v1-design/getVikeConfig/filesystemRouting.js'

type PageConfigBase = {
  pageId: string
  isErrorPage?: true
  routeFilesystem?: {
    routeString: string
    definedBy: string
  }
  configValues: ConfigValues
}

/** Page config data structure available at runtime */
type PageConfigRuntime = PageConfigBase & {
  /** Load config values that are lazily loaded such as config.Page */
  loadConfigValuesAll: () => Promise<{
    configValuesImported: ConfigValueImported[]
    configValuesSerialized: Record<string, ConfigValueSerialized>
  }>
}
/** Same as PageConfigRuntime but also contains all lazily loaded config values such as config.Page */
type PageConfigRuntimeLoaded = PageConfigRuntime & {
  /** Whether loadConfigValuesAll() was called */
  isAllLoaded: true
}

/** Page config data structure available at build-time */
type PageConfigBuildTime = PageConfigBase & {
  configValueSources: ConfigValueSources
  configValuesComputed: ConfigValuesComputed
}

/** Page config that applies to all pages */
type PageConfigGlobalRuntime = {
  configValues: ConfigValues
}
type PageConfigGlobalBuildTime = {
  configValueSources: ConfigValueSources
}

/** In what environment(s) the config value is loaded.
 *
 * https://vike.dev/meta
 */
type ConfigEnv = {
  client?: boolean
  server?: boolean
  config?: boolean
}
/** For Vike internal use */
type ConfigEnvInternal = Omit<ConfigEnv, 'client'> & {
  client?: boolean | 'if-client-routing'
  eager?: boolean
}

type ConfigValueSource = {
  value?: unknown
  configEnv: ConfigEnvInternal
  definedAt: DefinedAtFileFullInfo
  locationId: LocationId
  /** Wether the config value is loaded at runtime, for example config.Page or config.onBeforeRender */
  valueIsImportedAtRuntime: boolean
  /** Whether the config value is a file path, for example config.client */
  valueIsFilePath?: true
  valueIsDefinedByValueFile: boolean
}
type DefinedAtFileFullInfo = DefinedAtFile & FilePath & { fileExportName?: string }
type ConfigValueSources = Record<
  // configName
  string,
  ConfigValueSource[]
>

type ConfigValueComputed = {
  configEnv: ConfigEnvInternal
  value: unknown
}
type ConfigValuesComputed = Record<
  // configName
  string,
  ConfigValueComputed
>

type ConfigValue = {
  value: unknown
  definedAt: DefinedAt
}
type DefinedAt =
  // Normal config values => defined by a unique source / file path
  | DefinedAtFile
  // Cumulative config values => defined at multiple sources / file paths
  | { files: DefinedAtFile[] }
  // Computed config values => defined internally by Vike (currently, Vike doesn't support computed configs craeted by users)
  | { isComputed: true }
type DefinedAtFile = {
  filePathToShowToUser: string
  fileExportPathToShowToUser: null | string[]
}
type ConfigValues = Record<
  // configName
  string,
  ConfigValue
>

type FilePathResolved = FilePath & { filePathAbsoluteFilesystem: string }
type FilePath = {
  /** The file's path, absolute from Vite's perspective.
   *
   * We use this to generate import paths in virtual modules. (Virtual modules cannot have relative import paths.)
   *
   * Its value is equivalent to `filePath.filePathRelativeToUserRootDir ?? filePath.importPathAbsolute`, for example:
   *   - `vike-react/config`, or
   *   - `/pages/+config.js`.
   */
  filePathAbsoluteVite: string
  /** The file's path, absolute from the filesystem root.
   *
   * Example: `/home/rom/code/my-app/pages/some-page/Page.js`
   *
   * The value is `null` upon aliased import paths which we cannot resolve (we'd need to re-implement https://www.npmjs.com/package/@rollup/plugin-alias).
   */
  filePathAbsoluteFilesystem: string | null
  /** The file's path, shown to user upon logging.
   *
   * Currently, its value is equivalent to `FilePath['filePathAbsoluteVite']`.
   */
  filePathToShowToUser: string
} & (
  | {
      filePathRelativeToUserRootDir: null
      /** The file's path, as absolute import path. It's either:
       *  - an npm package import (e.g. `vike-react/config`), or
       *  - an alias (`#components/Counter').
       */
      importPathAbsolute: string
    }
  | {
      /** The file's path, relative to Vite's root (i.e. the user project's root directory).
       *
       * Example: `/pages/some-page/Page.js`
       */
      filePathRelativeToUserRootDir: string
      importPathAbsolute: null | string
    }
)
