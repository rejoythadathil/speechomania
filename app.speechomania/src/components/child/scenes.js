export const SCENES = {
  story: {
    tag: 'Story',
    background: 'linear-gradient(#fff0f0, #ffe2bd)',
    decor: [['books', 3, 82, 110]],
    how: [
      ['sound-on', 'Listen'],
      ['book', 'Look at the page'],
      ['arrow-right', 'Next page']
    ]
  },
  pick: {
    tag: 'Who can’t?',
    background: 'linear-gradient(#e3f6d6, #b5dd94)',
    decor: [['tree', 1, 46, 170]],
    how: [
      ['sound-on', 'Listen'],
      ['lion', 'Look at both'],
      ['raised-hand', 'Tap who can’t']
    ]
  },
  shark: {
    tag: 'Feed the shark',
    background: 'linear-gradient(#a9dcf6, #3a9fd6 55%, #1d6fa8)',
    decor: [
      ['seaweed', 3, 84, 100],
      ['coral', 16, 86, 90],
      ['coral', 90, 86, 90]
    ],
    how: [
      ['sound-on', 'Listen'],
      ['fish', 'Find the fish'],
      ['shark', 'Feed the shark']
    ]
  },
  balloons: {
    tag: 'Balloon pop',
    background: 'linear-gradient(#ffd9e6, #fff4f8)',
    decor: [['cloud', 4, 18, 130]],
    how: [
      ['sound-on', 'Listen'],
      ['smiling', 'Find the face'],
      ['pop', 'Pop the balloon']
    ]
  },
  bubbles: {
    tag: 'Word bubbles',
    background: 'linear-gradient(#d0f4ef, #8fd9d0)',
    decor: [['shell', 86, 84, 64]],
    how: [
      ['sound-on', 'Listen'],
      ['lemon', 'Look at the picture'],
      ['bubbles', 'Pop the word']
    ]
  },
  match: {
    tag: 'Memory cards',
    background: 'linear-gradient(#24365f, #4f5fa8)',
    decor: [['moon', 4, 18, 100]],
    how: [
      ['raised-hand', 'Turn two cards'],
      ['eyes', 'Remember them'],
      ['check-mark', 'Match the opposites']
    ]
  },
  squish: {
    tag: 'Word squish',
    background: 'linear-gradient(#fff3d6, #ffd98f)',
    decor: [],
    how: [
      ['sound-on', 'Listen'],
      ['clamp', 'Squish two words'],
      ['raised-hand', 'Tap the short word']
    ]
  },
  compare: {
    tag: 'Weigh it up',
    background: 'linear-gradient(#e2f6e7, #a7dcb4)',
    decor: [['tree', 1, 48, 170]],
    how: [
      ['sound-on', 'Listen'],
      ['scale', 'Look at both'],
      ['raised-hand', 'Tap the right one']
    ]
  },
  place: {
    tag: 'Put it there',
    background: 'linear-gradient(#eef8dd, #bfe39a)',
    decor: [
      ['tree', 84, 46, 170],
      ['flower', 6, 84, 64]
    ],
    how: [
      ['sound-on', 'Listen'],
      ['box', 'Find the spot'],
      ['cat', 'Put it there']
    ]
  },
  train: {
    tag: 'Word train',
    background: 'linear-gradient(#fdeedd, #f3c79a)',
    decor: [
      ['pine', 1, 56, 130],
      ['pine', 9, 64, 96]
    ],
    how: [
      ['sound-on', 'Listen'],
      ['wagon', 'Pick a wagon'],
      ['engine', 'Fill the gap']
    ]
  },
  yesno: {
    tag: 'Yes or no',
    background: 'linear-gradient(#f0e6ff, #cdb9fb)',
    decor: [['teddy', 86, 76, 100]],
    how: [
      ['sound-on', 'Listen'],
      ['thumbs-up', 'Yes'],
      ['thumbs-down', 'No']
    ]
  },
  why: {
    tag: 'Detective',
    background: 'linear-gradient(#fbf4e6, #e6d3ad)',
    decor: [['books', 3, 80, 110]],
    how: [
      ['sound-on', 'Listen'],
      ['detective', 'Look closely'],
      ['magnifier', 'Find the reason']
    ]
  }
}

export const sceneFor = (player) => SCENES[player] ?? SCENES.story
