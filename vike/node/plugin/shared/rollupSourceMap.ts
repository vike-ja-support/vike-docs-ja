export { sourceMapRemove }
export { sourceMapPassthrough }

// https://rollupjs.org/guide/en/#source-code-transformations

/** Remove entire source mapping, to save KBs. */
function sourceMapRemove(code: string): { code: string; map: { mappings: '' } } {
  return {
    code,
    map: { mappings: '' }
  }
}

/** Don't provide any source map, pass through current source map instead. */
function sourceMapPassthrough(code: string): { code: string; map: null } {
  return {
    code,
    map: null
  }
}
