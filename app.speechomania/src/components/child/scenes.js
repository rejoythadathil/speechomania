export const SCENES = {
  story: {
    tag: 'Story',
    background: 'linear-gradient(#fff0f0, #ffe2bd)',
    decor: [['rainbow', 3, 22, 130], ['sunflower', 88, 74, 90], ['green-apple', 6, 78, 70], ['butterfly', 86, 24, 60]],
    how: [['speaker', 'Listen'], ['book', 'Look'], ['star', 'Next page']]
  },
  pick: {
    tag: 'Who can’t?',
    background: 'linear-gradient(#e3f6d6, #b5dd94)',
    decor: [['tree', 1, 46, 170], ['monkey', 87, 24, 80], ['bee', 10, 22, 54], ['sunflower', 88, 76, 80], ['clover', 20, 86, 50]],
    how: [['speaker', 'Listen'], ['lion', 'Look at both'], ['raised-hand', 'Tap who can’t']]
  },
  shark: {
    tag: 'Feed the shark',
    background: 'linear-gradient(#a9dcf6, #3a9fd6 55%, #1d6fa8)',
    decor: [['seaweed', 3, 84, 100], ['coral', 16, 86, 90], ['shell', 44, 90, 56], ['seaweed', 78, 84, 90], ['coral', 90, 86, 90], ['bubbles', 92, 30, 56, 'rise']],
    how: [['speaker', 'Listen'], ['fish', 'Find the fish'], ['shark', 'Feed the shark']]
  },
  balloons: {
    tag: 'Balloon pop',
    background: 'linear-gradient(#ffd9e6, #fff4f8)',
    decor: [['cloud', 4, 22, 130, 'drift'], ['sun-cloud', 84, 20, 120], ['cloud', 70, 46, 90, 'drift'], ['party', 6, 80, 80]],
    how: [['speaker', 'Listen'], ['smiling', 'Find the face'], ['pop', 'Pop the balloon']]
  },
  bubbles: {
    tag: 'Word bubbles',
    background: 'linear-gradient(#d0f4ef, #8fd9d0)',
    decor: [['octopus', 3, 72, 130], ['bubbles', 88, 30, 70, 'rise'], ['shell', 86, 84, 64], ['tropical-fish', 88, 58, 80]],
    how: [['speaker', 'Listen'], ['lemon', 'Look at the picture'], ['bubbles', 'Pop the word']]
  },
  match: {
    tag: 'Memory cards',
    background: 'linear-gradient(#24365f, #4f5fa8)',
    decor: [['moon', 4, 22, 100], ['glowing-star', 88, 24, 64], ['sparkles', 86, 76, 80], ['glowing-star', 8, 78, 50]],
    how: [['sparkles', 'Turn two cards'], ['hot', 'Find opposites'], ['cold', 'Match them all']]
  },
  squish: {
    tag: 'Word squish',
    background: 'linear-gradient(#fff3d6, #ffd98f)',
    decor: [['palm', 1, 50, 160], ['sun', 86, 20, 90], ['turtle', 86, 80, 90], ['shell', 16, 88, 50]],
    how: [['speaker', 'Listen'], ['clamp', 'Squish two words'], ['star', 'Pick the short word']]
  },
  compare: {
    tag: 'Weigh it up',
    background: 'linear-gradient(#e2f6e7, #a7dcb4)',
    decor: [['tree', 1, 48, 170], ['sun', 86, 20, 80], ['flower', 18, 86, 54], ['butterfly', 88, 70, 60]],
    how: [['speaker', 'Listen'], ['scale', 'Look at both'], ['raised-hand', 'Tap the right one']]
  },
  place: {
    tag: 'Put it there',
    background: 'linear-gradient(#eef8dd, #bfe39a)',
    decor: [['tree', 84, 46, 170], ['butterfly', 8, 24, 60], ['flower', 6, 82, 64], ['hibiscus', 20, 88, 50]],
    how: [['speaker', 'Listen'], ['box', 'Find the spot'], ['cat', 'Put it there']]
  },
  train: {
    tag: 'Word train',
    background: 'linear-gradient(#fdeedd, #f3c79a)',
    decor: [['pine', 1, 56, 130], ['pine', 9, 64, 96], ['cloud', 76, 22, 110, 'drift'], ['camping', 86, 74, 90]],
    how: [['speaker', 'Listen'], ['wagon', 'Pick a wagon'], ['engine', 'Fill the gap']]
  },
  yesno: {
    tag: 'Yes or no',
    background: 'linear-gradient(#f0e6ff, #cdb9fb)',
    decor: [['rainbow', 2, 22, 130], ['teddy', 86, 76, 100], ['butterfly', 86, 24, 60], ['sparkles', 8, 80, 60]],
    how: [['speaker', 'Listen'], ['thumbs-up', 'Yes'], ['thumbs-down', 'No']]
  },
  why: {
    tag: 'Detective',
    background: 'linear-gradient(#fbf4e6, #e6d3ad)',
    decor: [['books', 3, 80, 110], ['closed-book', 88, 82, 70], ['glowing-star', 88, 24, 60], ['magnifier', 6, 24, 70]],
    how: [['speaker', 'Listen'], ['detective', 'Look closely'], ['magnifier', 'Find the reason']]
  }
}

export const sceneFor = (player) => SCENES[player] ?? SCENES.story
