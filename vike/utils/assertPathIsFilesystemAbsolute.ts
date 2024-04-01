export { assertPathIsFilesystemAbsolute }

import path from 'path'
import { assert } from './assert.js'
import { assertPosixPath } from './filesystemPathHandling.js'

/** Assert path is absolute from the filesystem root */
function assertPathIsFilesystemAbsolute(p: string) {
  assertPosixPath(p)
  assert(!p.startsWith('/@fs/'))
  if (process.platform !== 'win32') {
    assert(p.startsWith('/'))
  } else {
    assert(path.win32.isAbsolute(p))
  }
}
