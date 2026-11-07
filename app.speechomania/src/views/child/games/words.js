export function longForm({ sentence, answer, first, second }) {
  const text = sentence?.text
  if (!text) return null
  const at = text.toLowerCase().indexOf(answer.toLowerCase())
  if (at < 0) return null
  const long = `${first} ${second}`
  const shown = at === 0 ? long[0].toUpperCase() + long.slice(1) : long
  return text.slice(0, at) + shown + text.slice(at + answer.length)
}
