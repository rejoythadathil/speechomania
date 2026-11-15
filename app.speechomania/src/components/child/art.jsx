const files = import.meta.glob('../../assets/openmoji/*.svg', {
  eager: true,
  query: '?url',
  import: 'default'
})

const spriteFiles = import.meta.glob('../../assets/sprites/*.webp', {
  eager: true,
  query: '?url',
  import: 'default'
})

const byName = (found) =>
  Object.entries(found).map(([path, url]) => [
    path
      .split('/')
      .pop()
      .replace(/\.\w+$/, ''),
    url
  ])

export const ART = Object.fromEntries([...byName(files), ...byName(spriteFiles)])

const sceneFiles = import.meta.glob('../../assets/scenes/*.webp', {
  eager: true,
  query: '?url',
  import: 'default'
})

export const GAME_SCENES = Object.fromEntries(
  Object.entries(sceneFiles).map(([path, url]) => [path.split('/').pop().replace('.webp', ''), url])
)

export const GAME_ART = {
  story: ['book'],
  pick: ['lion', 'snake'],
  shark: ['shark', 'fish'],
  balloons: ['balloon', 'smiling'],
  bubbles: ['bubbles', 'octopus'],
  match: ['cards'],
  squish: ['clamp'],
  compare: ['scale', 'elephant'],
  choose: ['eyes', 'raised-hand'],
  place: ['box', 'cat'],
  train: ['engine', 'wagon'],
  yesno: ['thumbs-up', 'thumbs-down'],
  why: ['detective', 'magnifier'],
  cards: ['cards']
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
  roar: 'loud',
  run: 'walk',
  write: 'pen',
  talk: 'loud'
}

export const FISH = ['fish', 'tropical-fish', 'blowfish']

export function Art({ name, className, alt = '', style }) {
  return ART[name] ? (
    <img
      className={className}
      src={ART[name]}
      alt={alt}
      data-art={name}
      style={style}
      draggable="false"
    />
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
