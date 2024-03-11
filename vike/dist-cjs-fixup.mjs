import fs from 'fs/promises'
import path from 'path'
const sourceDir = 'dist/cjs'

main()

async function main() {
  await generatePackageJson()
  await shimImportMetaUrl()
}

async function generatePackageJson() {
  await fs.writeFile(sourceDir + '/package.json', '{ "type": "commonjs" }\n', 'utf8')
  console.log(`✅ ${sourceDir}/package.json generated`)
}

async function shimImportMetaUrl() {
  await processFiles(sourceDir)
  console.log(`✅ ${sourceDir}/ shimmed import.meta.url`)
}

async function replaceImportMetaWithFilename(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf8')
  const modifiedContent = fileContent.replace(/import\.meta\.url/g, '`file://${__filename}`')
  await fs.writeFile(filePath, modifiedContent, 'utf8')
}

async function processFiles(directoryPath) {
  const files = await fs.readdir(directoryPath)

  for (const file of files) {
    const filePath = path.join(directoryPath, file)
    const stats = await fs.stat(filePath)

    if (stats.isDirectory()) {
      await processFiles(filePath)
    } else if (stats.isFile() && filePath.endsWith('.js')) {
      await replaceImportMetaWithFilename(filePath)
    }
  }
}
