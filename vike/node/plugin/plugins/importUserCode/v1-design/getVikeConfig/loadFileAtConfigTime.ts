// Files loadded at config time:

export { loadImportedFile }
export { loadValueFile }
export { loadConfigFile }
export type { ImportedFilesLoaded }
export type { ConfigFile }

import { assert, assertUsage, hasProp, assertIsNotProductionRuntime } from '../../../../utils.js'
import type { FilePathResolved } from '../../../../../../shared/page-configs/FilePath.js'
import { transpileAndExecuteFile } from './transpileAndExecuteFile.js'
import type { InterfaceValueFile } from '../getVikeConfig.js'
import { assertPlusFileExport } from '../../../../../../shared/page-configs/assertPlusFileExport.js'
import pc from '@brillout/picocolors'
import { type ImportData, parseImportData } from './transformFileImports.js'
import { getConfigFileExport } from '../getConfigFileExport.js'
import { assertImportPath, resolveImportPath } from './resolveImportPath.js'
import { getFilePathResolved } from '../../../../shared/getFilePath.js'

assertIsNotProductionRuntime()

type ImportedFilesLoaded = Record<string, Promise<Record<string, unknown>>>
type ConfigFile = {
  fileExports: Record<string, unknown>
  filePath: FilePathResolved
  extendsFilePaths: string[]
}

// Load fake import
async function loadImportedFile(
  import_: FilePathResolved & { fileExportName: string },
  userRootDir: string,
  importedFilesLoaded: ImportedFilesLoaded
): Promise<unknown> {
  const f = import_.filePathAbsoluteFilesystem
  if (!importedFilesLoaded[f]) {
    importedFilesLoaded[f] = transpileAndExecuteFile(import_, userRootDir, false).then((r) => r.fileExports)
  }
  const fileExports = await importedFilesLoaded[f]!
  const fileExport = fileExports[import_.fileExportName]
  return fileExport
}

// Load +{configName}.js
async function loadValueFile(interfaceValueFile: InterfaceValueFile, configName: string, userRootDir: string) {
  const { fileExports } = await transpileAndExecuteFile(interfaceValueFile.filePath, userRootDir, false)
  const { filePathToShowToUser } = interfaceValueFile.filePath
  assertPlusFileExport(fileExports, filePathToShowToUser, configName)
  Object.entries(fileExports).forEach(([exportName, configValue]) => {
    const configName_ = exportName === 'default' ? configName : exportName
    interfaceValueFile.fileExportsByConfigName[configName_] = { configValue }
  })
}

// Load +config.js, including all its extends fake imports
async function loadConfigFile(
  configFilePath: FilePathResolved,
  userRootDir: string,
  visited: string[],
  isExtensionConfig: boolean
): Promise<{ configFile: ConfigFile; extendsConfigs: ConfigFile[] }> {
  const { filePathAbsoluteFilesystem } = configFilePath
  assertNoInfiniteLoop(visited, filePathAbsoluteFilesystem)
  const { fileExports } = await transpileAndExecuteFile(
    configFilePath,
    userRootDir,
    isExtensionConfig ? 'is-extension-config' : true
  )
  const { extendsConfigs, extendsFilePaths } = await loadExtendsConfigs(fileExports, configFilePath, userRootDir, [
    ...visited,
    filePathAbsoluteFilesystem
  ])

  const configFile: ConfigFile = {
    fileExports,
    filePath: configFilePath,
    extendsFilePaths
  }
  return { configFile, extendsConfigs }
}
function assertNoInfiniteLoop(visited: string[], filePathAbsoluteFilesystem: string) {
  const idx = visited.indexOf(filePathAbsoluteFilesystem)
  if (idx === -1) return
  const loop = visited.slice(idx)
  assert(loop[0] === filePathAbsoluteFilesystem)
  assertUsage(idx === -1, `Infinite extends loop ${[...loop, filePathAbsoluteFilesystem].join('>')}`)
}
async function loadExtendsConfigs(
  configFileExports: Record<string, unknown>,
  configFilePath: FilePathResolved,
  userRootDir: string,
  visited: string[]
) {
  const extendsImportData = getExtendsImportData(configFileExports, configFilePath)
  const extendsConfigFiles: FilePathResolved[] = []
  extendsImportData.map((importData) => {
    const { importPath: importPathAbsolute } = importData
    const filePathAbsoluteFilesystem = resolveImportPath(importData, configFilePath)
    assertImportPath(filePathAbsoluteFilesystem, importData, configFilePath)
    const filePath = getFilePathResolved({ filePathAbsoluteFilesystem, userRootDir, importPathAbsolute })
    extendsConfigFiles.push(filePath)
  })

  const extendsConfigs: ConfigFile[] = []
  await Promise.all(
    extendsConfigFiles.map(async (configFilePath) => {
      const result = await loadConfigFile(configFilePath, userRootDir, visited, true)
      extendsConfigs.push(result.configFile)
      extendsConfigs.push(...result.extendsConfigs)
    })
  )

  const extendsFilePaths = extendsConfigFiles.map((f) => f.filePathAbsoluteFilesystem)

  return { extendsConfigs, extendsFilePaths }
}
function getExtendsImportData(
  configFileExports: Record<string, unknown>,
  configFilePath: FilePathResolved
): ImportData[] {
  const { filePathToShowToUser } = configFilePath
  const configFileExport = getConfigFileExport(configFileExports, filePathToShowToUser)
  const wrongUsage = `${filePathToShowToUser} sets the config ${pc.cyan(
    'extends'
  )} to an invalid value, see https://vike.dev/extends`
  let extendList: string[]
  if (!('extends' in configFileExport)) {
    return []
  } else if (hasProp(configFileExport, 'extends', 'string')) {
    extendList = [configFileExport.extends]
  } else if (hasProp(configFileExport, 'extends', 'string[]')) {
    extendList = configFileExport.extends
  } else {
    assertUsage(false, wrongUsage)
  }
  const extendsImportData = extendList.map((importDataSerialized) => {
    const importData = parseImportData(importDataSerialized)
    assertUsage(importData, wrongUsage)
    return importData
  })
  return extendsImportData
}
