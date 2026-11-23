const SET_SIZE = 5

export function inSets(pages) {
  const sets = Math.max(1, Math.floor(pages.length / SET_SIZE))
  const setOf = (index) => Math.min(Math.floor(index / SET_SIZE), sets - 1) + 1
  return pages.flatMap((page, index) => {
    const set = setOf(index)
    const tagged = { ...page, set, sets }
    return set < sets && setOf(index + 1) > set ? [tagged, { step: 'break', set, sets }] : [tagged]
  })
}
