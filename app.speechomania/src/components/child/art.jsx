const files = import.meta.glob('../../assets/openmoji/*.svg', {
  eager: true,
  query: '?url',
  import: 'default'
})

export const ART = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop().replace('.svg', ''), url])
)

export const GAME_ART = {
  story: ['book'],
  pick: ['lion', 'snake'],
  shark: ['shark', 'fish'],
  balloons: ['balloon', 'party'],
  bubbles: ['bubbles', 'octopus'],
  match: ['sparkles', 'chick'],
  squish: ['clamp', 'turtle'],
  compare: ['scale', 'elephant'],
  place: ['box', 'cat'],
  train: ['engine', 'wagon'],
  yesno: ['thumbs-up', 'thumbs-down'],
  why: ['detective', 'magnifier']
}

export const ACTION_ART = {
  swim: 'bubbles',
  walk: 'walk',
  fly: 'cloud',
  bark: 'loud',
  climb: 'tree',
  ride: 'bike',
  morning: 'sunrise',
  sing: 'music',
  school: 'school',
  roar: 'loud'
}

export const FISH = ['fish', 'tropical-fish', 'blowfish']

export function Art({ name, className, alt = '' }) {
  return ART[name] ? (
    <img className={className} src={ART[name]} alt={alt} data-art={name} draggable="false" />
  ) : null
}

export const AVATARS = [
  'lion',
  'rabbit',
  'panda',
  'fox',
  'koala',
  'penguin',
  'owl',
  'frog',
  'bear',
  'unicorn'
]

export function avatarFor(id) {
  let sum = 0
  for (const char of id) sum = (sum + char.charCodeAt(0)) % 997
  return AVATARS[sum % AVATARS.length]
}

export function StepArt({ step, className, artClassName }) {
  if (step.art?.length) {
    return (
      <span className={className} data-count={step.art.length}>
        {step.art.map((name, index) => (
          <Art key={`${name}-${index}`} name={name} className={artClassName} />
        ))}
      </span>
    )
  }
  if (step.image_url) {
    return (
      <span className={className} data-count="1">
        <img className={artClassName} src={step.image_url} alt="" draggable="false" />
      </span>
    )
  }
  return null
}
