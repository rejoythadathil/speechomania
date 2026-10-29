const INK = '#2a3b4c'
const line = (w = 5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`
const limb = (d, color, w = 16) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 10}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
const eye = (x, y, r = 6.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.32}" fill="#fff"/>`
const shut = (x, y, w = 8) => `<path d="M${x - w} ${y} Q${x} ${y + w * 0.8} ${x + w} ${y}" fill="none" ${line(4.5)}/>`
const smile = (x, y, w = 10) => `<path d="M${x - w} ${y} Q${x} ${y + w * 0.75} ${x + w} ${y}" fill="none" ${line(4.5)}/>`
const open = (x, y, w = 13, h = 15) => `<path d="M${x - w} ${y} Q${x} ${y - 4} ${x + w} ${y} Q${x + w * 0.6} ${y + h} ${x} ${y + h} Q${x - w * 0.6} ${y + h} ${x - w} ${y}Z" fill="#7a2f3a" ${line(4.5)}/><path d="M${x - w * 0.45} ${y + h * 0.72} Q${x} ${y + h * 0.4} ${x + w * 0.45} ${y + h * 0.72}" fill="#f08a8a"/>`
const blush = (x1, x2, y) => `<circle cx="${x1}" cy="${y}" r="7" fill="#f19c8c" opacity="0.45"/><circle cx="${x2}" cy="${y}" r="7" fill="#f19c8c" opacity="0.45"/>`

function kid(o) {
  const skin = o.skin
  const top = o.top ?? 0
  const legs = o.shorts
    ? limb('M106 170 L104 222', skin, 15) + limb('M134 170 L136 222', skin, 15) + `<path d="M90 160 h60 v26 h-24 l-6 -8 l-6 8 h-24z" fill="${o.shorts}" ${line()}/>`
    : limb('M106 170 L104 222', o.pants, 17) + limb('M134 170 L136 222', o.pants, 17)
  const shoes = `<ellipse cx="100" cy="226" rx="15" ry="8" fill="${o.shoes || '#3d4f63'}" ${line(4)}/><ellipse cx="140" cy="226" rx="15" ry="8" fill="${o.shoes || '#3d4f63'}" ${line(4)}/>`
  const armL = o.armsUp ? 'M94 128 Q78 104 74 84' : 'M94 128 Q80 150 84 174'
  const armR = o.armsUp ? 'M146 128 Q162 104 166 84' : 'M146 128 Q160 150 156 174'
  const arms = limb(armL, o.sleeve || o.shirt, 15) + limb(armR, o.sleeve || o.shirt, 15) +
    `<circle cx="${o.armsUp ? 74 : 84}" cy="${o.armsUp ? 82 : 176}" r="8" fill="${skin}" ${line(4)}/><circle cx="${o.armsUp ? 166 : 156}" cy="${o.armsUp ? 82 : 176}" r="8" fill="${skin}" ${line(4)}/>`
  const body = `<rect x="90" y="116" width="60" height="62" rx="22" fill="${o.shirt}" ${line()}/>${o.stripes ? `<path d="M92 136 h56 M92 152 h56" stroke="${o.stripes}" stroke-width="7"/>` : ''}`
  const pack = o.backpack ? `<rect x="70" y="118" width="26" height="46" rx="10" fill="#e76f51" ${line(4)}/><path d="M96 124 L112 120" ${line(4)}/>` : ''
  const ears = `<circle cx="77" cy="${82 + top}" r="9" fill="${skin}" ${line(4)}/><circle cx="163" cy="${82 + top}" r="9" fill="${skin}" ${line(4)}/>`
  const head = `<circle cx="120" cy="${78 + top}" r="44" fill="${skin}" ${line()}/>`
  const face = (o.sleep ? shut(104, 84 + top) + shut(136, 84 + top) : eye(104, 84 + top) + eye(136, 84 + top)) + blush(92, 148, 98 + top) + (o.shout ? open(120, 100 + top, 9, 11) : smile(120, 101 + top, 8))
  return pack + legs + shoes + arms + body + ears + head + (o.hair || '') + face + (o.extra || '')
}

const HAIR = {
  boy: '<path d="M78 72 Q80 32 120 32 Q162 32 163 74 Q150 56 132 60 Q118 44 100 58 Q88 56 78 72Z" fill="#2f2622" stroke="#2a3b4c" stroke-width="5" stroke-linejoin="round"/>',
  toddler: '<path d="M84 64 Q96 36 124 38 Q150 40 158 66 Q142 54 120 56 Q100 54 84 64Z" fill="#3a2a22" stroke="#2a3b4c" stroke-width="5" stroke-linejoin="round"/><path d="M118 38 Q126 24 136 30" fill="none" stroke="#2a3b4c" stroke-width="5" stroke-linecap="round"/>',
  cap: '<path d="M76 80 Q76 32 120 32 Q164 32 164 80 Z" fill="#3c8dd9" stroke="#2a3b4c" stroke-width="5" stroke-linejoin="round"/><path d="M90 46 Q120 34 150 46" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/><circle cx="104" cy="66" r="10" fill="#bfe6f5" stroke="#2a3b4c" stroke-width="4"/><circle cx="136" cy="66" r="10" fill="#bfe6f5" stroke="#2a3b4c" stroke-width="4"/><path d="M114 66 h12" stroke="#2a3b4c" stroke-width="4"/>'
}

function person(id, v) {
  if (id === 'baby') {
    const sk = '#e2a87e'
    return `<ellipse cx="120" cy="198" rx="54" ry="34" fill="#f6d36b" ${line()}/>` +
      limb('M84 206 Q70 220 58 222', sk, 15) + limb('M156 206 Q170 220 182 222', sk, 15) +
      limb('M92 168 Q76 184 80 200', '#f6d36b', 14) + limb('M148 168 Q164 184 160 200', '#f6d36b', 14) +
      `<path d="M86 170 Q120 150 154 170 L150 200 Q120 214 90 200Z" fill="#f6d36b" ${line()}/><path d="M100 184 h40" stroke="#f0b93f" stroke-width="6" stroke-linecap="round"/>` +
      `<circle cx="74" cy="122" r="9" fill="${sk}" ${line(4)}/><circle cx="166" cy="122" r="9" fill="${sk}" ${line(4)}/><circle cx="120" cy="118" r="48" fill="${sk}" ${line()}/>` +
      `<path d="M114 72 Q118 58 132 62 Q124 66 126 74" fill="none" ${line(5)}/>` +
      eye(103, 122) + eye(137, 122) + blush(90, 150, 136) + smile(120, 140, 7)
  }
  if (id === 'toddler') return `<g transform="translate(24 40) scale(0.8)">${kid({ skin: '#c98d62', shirt: '#7cc4a4', stripes: '#ffffff', shorts: '#4f7cac', hair: HAIR.toddler, backpack: v === 'act', shoes: '#e76f51' })}</g>`
  if (id === 'boy') {
    if (v === 'act') return bikeRider()
    return kid({ skin: '#b97a4f', shirt: '#f08c4b', pants: '#3f5f86', hair: HAIR.boy })
  }
  if (id === 'swimmer') {
    if (v === 'act') return `<g>${kid({ skin: '#d29a6f', shirt: '#d29a6f', sleeve: '#d29a6f', shorts: '#3c8dd9', hair: HAIR.cap, armsUp: true })}</g>`
    if (v === 'awake') return kid({ skin: '#d29a6f', shirt: '#d29a6f', sleeve: '#d29a6f', shorts: '#3c8dd9', hair: HAIR.cap, armsUp: true })
    return kid({ skin: '#d29a6f', shirt: '#d29a6f', sleeve: '#d29a6f', shorts: '#3c8dd9', hair: HAIR.cap })
  }
}

function bikeRider() {
  const wheel = (x) => `<circle cx="${x}" cy="196" r="32" fill="none" ${line(7)}/><circle cx="${x}" cy="196" r="6" fill="${INK}"/>`
  const frame = `<path d="M60 196 L108 196 L150 146 L96 146 Z M108 196 L92 136 M150 146 L180 196 M146 130 L150 146" fill="none" stroke="#e05d5d" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M80 134 h24" ${line(8)}/><path d="M138 126 h20" ${line(7)}/>`
  const sk = '#b97a4f'
  const rider = limb('M98 120 L112 168 L110 196', '#3f5f86', 15) + limb('M104 118 L132 160 L118 186', '#3f5f86', 15) +
    `<rect x="78" y="62" width="54" height="62" rx="20" fill="#f08c4b" ${line()} transform="rotate(14 105 93)"/>` +
    limb('M118 76 Q138 98 148 126', '#f08c4b', 14) + `<circle cx="148" cy="128" r="8" fill="${sk}" ${line(4)}/>` +
    `<circle cx="84" cy="34" r="8" fill="${sk}" ${line(4)}/><circle cx="118" cy="30" r="36" fill="${sk}" ${line()}/>` +
    `<path d="M84 26 Q86 -6 118 -6 Q152 -6 154 28 Q142 12 128 16 Q116 4 102 14 Q92 12 84 26Z" fill="#2f2622" ${line()}/>` +
    eye(110, 34, 5.5) + eye(136, 34, 5.5) + smile(124, 50, 7) + `<circle cx="146" cy="44" r="6" fill="#f19c8c" opacity="0.45"/>`
  return wheel(60) + wheel(180) + frame + `<g transform="translate(0 6)">${rider}</g>`
}

function animal(id, v) {
  if (id === 'dog') {
    const fur = '#e3ad72'
    const lite = '#fbeedb'
    return `<path d="M54 132 Q30 118 36 92" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M54 132 Q30 118 36 92" fill="none" stroke="${fur}" stroke-width="10" stroke-linecap="round"/>` +
      limb('M74 160 L72 214', fur, 17) + limb('M98 162 L98 216', fur, 17) + limb('M138 160 L140 216', fur, 17) + limb('M160 156 L164 214', fur, 17) +
      `<ellipse cx="116" cy="142" rx="64" ry="36" fill="${fur}" ${line()}/><ellipse cx="124" cy="152" rx="34" ry="20" fill="${lite}"/>` +
      `<ellipse cx="140" cy="102" rx="16" ry="30" fill="#a8693c" ${line()} transform="rotate(24 140 102)"/><ellipse cx="206" cy="102" rx="16" ry="30" fill="#a8693c" ${line()} transform="rotate(-24 206 102)"/>` +
      `<circle cx="172" cy="94" r="42" fill="${fur}" ${line()}/><ellipse cx="174" cy="114" rx="24" ry="17" fill="${lite}" ${line(4)}/>` +
      eye(158, 88) + eye(188, 88) + `<ellipse cx="174" cy="104" rx="8" ry="6" fill="${INK}"/>` +
      (v === 'act' ? open(174, 116, 10, 12) : smile(174, 117, 7))
  }
  if (id === 'cat') {
    const fur = '#f2a65a'
    const lite = '#fde4c4'
    return `<path d="M158 206 Q206 200 196 150" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M158 206 Q206 200 196 150" fill="none" stroke="${fur}" stroke-width="12" stroke-linecap="round"/>` +
      `<path d="M120 112 Q170 112 168 180 Q166 222 120 222 Q74 222 72 180 Q70 112 120 112Z" fill="${fur}" ${line()}/><ellipse cx="120" cy="184" rx="26" ry="32" fill="${lite}"/>` +
      `<ellipse cx="100" cy="222" rx="16" ry="9" fill="${fur}" ${line(4)}/><ellipse cx="140" cy="222" rx="16" ry="9" fill="${fur}" ${line(4)}/>` +
      `<path d="M80 74 L76 28 L112 50Z" fill="${fur}" ${line()}/><path d="M160 74 L164 28 L128 50Z" fill="${fur}" ${line()}/><path d="M84 60 L82 40 L100 52Z" fill="#f4b3a8"/><path d="M156 60 L158 40 L140 52Z" fill="#f4b3a8"/>` +
      `<circle cx="120" cy="86" r="46" fill="${fur}" ${line()}/><path d="M104 48 l4 14 M120 44 v14 M136 48 l-4 14" ${line(4)}/>` +
      `<ellipse cx="120" cy="104" rx="20" ry="14" fill="${lite}"/>` + eye(102, 86) + eye(138, 86) +
      `<path d="M114 96 h12 l-6 7z" fill="#e8838d" ${line(3)}/>` + smile(120, 107, 6) +
      `<path d="M92 104 L66 100 M92 110 L68 114 M148 104 L174 100 M148 110 L172 114" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
  }
  if (id === 'lion') {
    const fur = '#f2b552'
    const mane = '#c8742c'
    const tufts = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<circle cx="${120 + Math.cos(a) * 54}" cy="${86 + Math.sin(a) * 54}" r="22" fill="${mane}" ${line()}/>` }).join('')
    return `<path d="M160 206 Q210 206 204 160" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/><path d="M160 206 Q210 206 204 160" fill="none" stroke="${fur}" stroke-width="9" stroke-linecap="round"/><circle cx="204" cy="152" r="12" fill="${mane}" ${line(4)}/>` +
      `<path d="M120 124 Q170 124 166 184 Q164 222 120 222 Q76 222 74 184 Q70 124 120 124Z" fill="${fur}" ${line()}/>` +
      `<ellipse cx="100" cy="222" rx="17" ry="9" fill="${fur}" ${line(4)}/><ellipse cx="140" cy="222" rx="17" ry="9" fill="${fur}" ${line(4)}/>` +
      tufts + `<circle cx="120" cy="86" r="56" fill="${mane}"/>` +
      `<circle cx="86" cy="52" r="12" fill="${fur}" ${line(4)}/><circle cx="154" cy="52" r="12" fill="${fur}" ${line(4)}/>` +
      `<circle cx="120" cy="88" r="44" fill="${fur}" ${line()}/><ellipse cx="120" cy="108" rx="24" ry="17" fill="#fbe3b6"/>` +
      eye(103, 84) + eye(137, 84) + `<path d="M112 98 h16 l-8 8z" fill="${INK}"/>` +
      (v === 'act' ? open(120, 112, 13, 16) : smile(120, 114, 8))
  }
  if (id === 'monkey') {
    const fur = '#9a6a45'
    const lite = '#f2d2ae'
    const up = v === 'act'
    return `<path d="M152 200 Q200 210 196 170 Q194 146 176 154" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/><path d="M152 200 Q200 210 196 170 Q194 146 176 154" fill="none" stroke="${fur}" stroke-width="9" stroke-linecap="round"/>` +
      limb('M104 196 L98 222', fur, 16) + limb('M136 196 L142 222', fur, 16) +
      (up ? '' : limb('M96 140 Q72 168 80 196', fur, 15) + limb('M144 140 Q168 168 160 196', fur, 15)) +
      `<ellipse cx="120" cy="164" rx="42" ry="46" fill="${fur}" ${line()}/><ellipse cx="120" cy="172" rx="24" ry="30" fill="${lite}"/>` +
      (up ? limb('M90 140 Q60 112 62 56', fur, 15) + limb('M150 140 Q180 112 178 56', fur, 15) + `<circle cx="62" cy="52" r="10" fill="${lite}" ${line(4)}/><circle cx="178" cy="52" r="10" fill="${lite}" ${line(4)}/>` : '') +
      `<circle cx="72" cy="80" r="17" fill="${lite}" ${line()}/><circle cx="168" cy="80" r="17" fill="${lite}" ${line()}/>` +
      `<circle cx="120" cy="78" r="46" fill="${fur}" ${line()}/>` +
      `<path d="M120 62 Q100 50 92 66 Q84 84 96 96 Q92 120 120 122 Q148 120 144 96 Q156 84 148 66 Q140 50 120 62Z" fill="${lite}" ${line(4)}/>` +
      eye(106, 78) + eye(134, 78) + `<circle cx="114" cy="98" r="2.5" fill="${INK}"/><circle cx="126" cy="98" r="2.5" fill="${INK}"/>` + smile(120, 106, 10)
  }
  if (id === 'bird') {
    const body = '#4f9fe0'
    const lite = '#cfe7fa'
    const fly = v === 'act' || v === 'fly'
    const wing = fly
      ? `<path d="M96 120 Q60 70 30 76 Q54 104 70 132Z" fill="#3a83c4" ${line()}/><path d="M144 120 Q180 70 210 76 Q186 104 170 132Z" fill="#3a83c4" ${line()}/>`
      : `<path d="M150 132 Q186 140 176 176 Q154 172 144 150Z" fill="#3a83c4" ${line()}/>`
    return (fly ? '' : `<path d="M110 198 L104 222 M130 198 L136 222 M96 222 h16 M128 222 h16" stroke="#f0a43c" stroke-width="7" stroke-linecap="round"/>`) +
      `<path d="M78 170 L54 186 L62 160Z" fill="#3a83c4" ${line()}/>` + wing +
      `<ellipse cx="120" cy="144" rx="58" ry="60" fill="${body}" ${line()}/><ellipse cx="124" cy="164" rx="34" ry="34" fill="${lite}"/>` +
      `<path d="M110 86 Q114 70 126 74 Q118 80 122 88" fill="none" ${line(5)}/>` +
      eye(104, 126) + eye(140, 126) + `<path d="M114 140 L134 140 L124 156Z" fill="#f4a63a" ${line(4)}/>`
  }
  if (id === 'snake') {
    const g = '#86c66b'
    const d = 'M48 214 Q30 186 70 182 L170 182 Q210 182 196 206 Q186 222 150 220 L90 220'
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${g}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M96 186 L96 170 M126 186 L126 170 M156 186 L156 170" stroke="#6aa955" stroke-width="5" stroke-linecap="round" opacity="0.7"/>` +
      `<path d="M60 186 Q52 140 86 112" fill="none" stroke="${INK}" stroke-width="40" stroke-linecap="round"/><path d="M60 186 Q52 140 86 112" fill="none" stroke="${g}" stroke-width="30" stroke-linecap="round"/>` +
      `<ellipse cx="104" cy="100" rx="38" ry="30" fill="${g}" ${line()}/>` +
      eye(96, 92) + eye(122, 92) + smile(112, 108, 9) + `<path d="M140 108 L156 112 M156 112 l8 -5 M156 112 l8 5" stroke="#e05d5d" stroke-width="4" stroke-linecap="round"/>`
  }
  if (id === 'bat') {
    const fur = '#6b6585'
    const wing = '#857fa0'
    const sleep = v === 'sleep'
    const head = `<path d="M86 96 L80 44 L110 76Z" fill="${fur}" ${line()}/><path d="M154 96 L160 44 L130 76Z" fill="${fur}" ${line()}/><circle cx="120" cy="104" r="40" fill="${fur}" ${line()}/>`
    if (sleep) {
      return `<path d="M108 204 L104 220 M132 204 L136 220" ${line(5)}/>` +
        `<path d="M120 128 Q70 134 74 180 Q80 214 120 212 Q160 214 166 180 Q170 134 120 128Z" fill="${wing}" ${line()}/>` +
        `<path d="M120 140 Q104 170 120 208 M120 140 Q136 170 120 208" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity="0.5"/>` +
        head + shut(104, 104, 8) + shut(136, 104, 8) + smile(120, 120, 6)
    }
    const w = `<path d="M96 132 Q60 96 18 112 Q40 126 34 146 Q52 140 58 158 Q74 146 88 160Z" fill="${wing}" ${line()}/><path d="M144 132 Q180 96 222 112 Q200 126 206 146 Q188 140 182 158 Q166 146 152 160Z" fill="${wing}" ${line()}/>`
    return w + `<path d="M108 196 L104 214 M132 196 L136 214" ${line(5)}/>` +
      `<ellipse cx="120" cy="160" rx="38" ry="44" fill="${fur}" ${line()}/><ellipse cx="120" cy="170" rx="20" ry="24" fill="#9b95b4"/>` +
      head + eye(104, 102) + eye(136, 102) + smile(120, 120, 8) +
      `<path d="M114 124 l3 6 l3 -6 M120 124 l3 6 l3 -6" fill="#fff" ${line(2)}/>`
  }
}

const CHARACTERS = new Set(['baby', 'swimmer', 'dog', 'snake', 'bird', 'cat', 'lion', 'monkey', 'boy', 'bat', 'toddler'])
const PEOPLE = new Set(['baby', 'toddler', 'boy', 'swimmer'])

export function characterMarkup(id, variant = 'idle') {
  if (!CHARACTERS.has(id)) return ''
  const inner = PEOPLE.has(id) ? person(id, variant) : animal(id, variant)
  return `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${inner}</svg>`
}
