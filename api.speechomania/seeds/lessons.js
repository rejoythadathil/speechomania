const line = (text) => ({ text })
const cant = 'can’t'
const cap = (text) => `${text[0].toUpperCase()}${text.slice(1)}`
const others = (list, index, count) =>
  Array.from({ length: count }, (_, step) => list[(index + 1 + step * 3) % list.length])

const play = {
  retry: line('Let’s look again.'),
  yes: line('Yes!'),
  outro: line('You did it!'),
  reward: line('You earned a trophy!')
}

const names = { swimmer: 'big boy' }
const called = (id) => names[id] ?? id

const canAndCant = {
  player: 'pick',
  contrast: cant,
  lines: {
    intro: line('Let’s read together.'),
    quiz: line('Now, show me.'),
    retry: line('Let’s look again.'),
    skip: line('Let’s try another.'),
    outro: line('The end. Great reading!'),
    reward: line('You earned a sticker!')
  },
  steps: [
    ['swim', 'baby', 'swimmer', 'swim'],
    ['walk', 'snake', 'dog', 'walk'],
    ['fly', 'snake', 'bird', 'fly'],
    ['bark', 'cat', 'dog', 'bark'],
    ['climb a tree', 'elephant', 'monkey', 'climb'],
    ['ride a cycle', 'cat', 'boy', 'ride'],
    ['sing', 'fish', 'bird', 'sing'],
    ['go to school', 'monkey', 'girl', 'school'],
    ['roar', 'monkey', 'lion', 'roar'],
    ['fly', 'penguin', 'bird', 'fly'],
    ['walk', 'fish', 'duck', 'walk'],
    ['run fast', 'snail', 'horse', 'run'],
    ['climb a tree', 'fish', 'cat', 'climb'],
    ['write', 'baby', 'girl', 'write'],
    ['talk', 'dog', 'boy', 'talk']
  ].map(([verb, cannot, can, act], index) => ({
    text: `Who ${cant} ${verb}?`,
    choices: index % 2 ? [can, cannot] : [cannot, can],
    answer: cannot,
    actor: can,
    act,
    praise: line(`Yes! The ${called(cannot)} ${cant} ${verb}.`),
    teach: line(`The ${called(cannot)} ${cant} ${verb}. The ${called(can)} can ${verb}.`)
  }))
}

const verbs = [
  ['running', 'running'],
  ['walking', 'walking'],
  ['swimming', 'swimming'],
  ['dancing', 'dancing'],
  ['cooking', 'cooking'],
  ['sleeping', 'sleeping'],
  ['writing', 'writing'],
  ['singing', 'singing'],
  ['painting', 'painting'],
  ['climbing', 'climbing'],
  ['cycling', 'riding'],
  ['clapping', 'clapping'],
  ['hugging', 'hugging'],
  ['juggling', 'juggling'],
  ['surfing', 'surfing']
]
const doer = { dancing: 'She is', hugging: 'They are', clapping: 'We are' }
const actionWords = {
  player: 'shark',
  lines: { ...play, intro: line('The shark is hungry. Feed it the right fish.') },
  steps: verbs.map(([word, art]) => ({
    text: `Feed me ${word}!`,
    word,
    art: [art],
    praise: line(`Yum! ${cap(word)}!`),
    sentence: line(`${doer[word] ?? 'He is'} ${word}.`)
  }))
}

const moods = [
  ['happy', 'smiling'],
  ['sad', 'sad'],
  ['angry', 'angry'],
  ['scared', 'scared'],
  ['surprised', 'surprised'],
  ['crying', 'crying'],
  ['laughing', 'laughing'],
  ['nervous', 'nervous'],
  ['thinking', 'thinking'],
  ['sleepy', 'sleepy'],
  ['sick', 'sick'],
  ['hot', 'hot'],
  ['cold', 'cold'],
  ['tired', 'tired'],
  ['shy', 'peek']
]
const feelings = {
  player: 'balloons',
  lines: { ...play, intro: line('Pop the balloon with the right face.') },
  steps: moods.map(([word, art]) => ({
    text: `Pop the ${word} face!`,
    word,
    art: [art],
    praise: line(`Pop! That face is ${word}.`),
    sentence: line(`This face is ${word}.`)
  }))
}

const things = [
  ['hot', 'fire', 'The fire is hot.'],
  ['cold', 'ice', 'The ice is cold.'],
  ['wet', 'umbrella', 'The umbrella is wet.'],
  ['soft', 'teddy', 'The teddy is soft.'],
  ['sharp', 'scissors', 'The scissors are sharp.'],
  ['sweet', 'candy', 'The toffee is sweet.'],
  ['sour', 'lemon', 'The lemon is sour.'],
  ['loud', 'loud', 'The speaker is loud.'],
  ['fast', 'rocket', 'The rocket is fast.'],
  ['slow', 'snail', 'The snail is slow.'],
  ['tiny', 'ant', 'The ant is tiny.'],
  ['shiny', 'glowing-star', 'The star is shiny.'],
  ['big', 'elephant', 'The elephant is big.'],
  ['tall', 'giraffe', 'The giraffe is tall.'],
  ['heavy', 'rock', 'The rock is heavy.']
]
const describingWords = {
  player: 'bubbles',
  lines: { ...play, intro: line('Look at the picture. Pop the word that fits.') },
  steps: things.map(([word, art, sentence], index) => ({
    text: 'Which word fits the picture?',
    art: [art],
    choices: [word, ...others(things, index, 2).map((item) => item[0])],
    answer: word,
    sentence: line(sentence)
  }))
}

const pairs = [
  ['hot', 'cold', 'hot', 'cold'],
  ['big', 'small', 'elephant', 'mouse'],
  ['fast', 'slow', 'rocket', 'snail'],
  ['open', 'closed', 'open', 'locked'],
  ['day', 'night', 'sun', 'moon'],
  ['full', 'empty', 'full', 'empty'],
  ['old', 'young', 'old-man', 'baby'],
  ['up', 'down', 'up', 'down'],
  ['sweet', 'sour', 'candy', 'lemon'],
  ['healthy', 'sick', 'strong', 'sick'],
  ['tall', 'short', 'giraffe', 'turtle'],
  ['heavy', 'light', 'rock', 'feather'],
  ['happy', 'sad', 'smiling', 'sad'],
  ['hard', 'soft', 'rock', 'teddy'],
  ['awake', 'asleep', 'running', 'sleeping']
]
const opposites = {
  player: 'match',
  lines: {
    ...play,
    intro: line('Turn two cards. Find the opposites.'),
    quiz: line('Find the opposites.')
  },
  steps: pairs.map(([first, second, one, two]) => ({
    text: `${cap(first)} and ${second}.`,
    first,
    second,
    art: [one, two],
    praise: line(`${cap(first)} and ${second} are opposites!`)
  }))
}

const contractions = [
  ['do', 'not', 'don’t', 'Don’t touch the fire.', ['raised-hand', 'fire']],
  ['I', 'am', 'I’m', 'I’m jumping.', ['cartwheel']],
  ['can', 'not', 'can’t', 'The duck can’t climb.', ['duck', 'ladder']],
  ['is', 'not', 'isn’t', 'He isn’t awake.', ['sleeping']],
  ['we', 'are', 'we’re', 'We’re running.', ['running', 'runner-girl']],
  ['will', 'not', 'won’t', 'He won’t eat broccoli.', ['broccoli']],
  ['they', 'are', 'they’re', 'They’re playing.', ['football', 'basketball']],
  ['it', 'is', 'it’s', 'It’s raining.', ['rain']],
  ['he', 'is', 'he’s', 'He’s eating.', ['spaghetti']],
  ['she', 'is', 'she’s', 'She’s dancing.', ['dancing']],
  ['you', 'are', 'you’re', 'You’re my friend.', ['hugging']],
  ['did', 'not', 'didn’t', 'I didn’t eat the cake.', ['cake']],
  ['I', 'will', 'I’ll', 'I’ll go to school.', ['school']],
  ['are', 'not', 'aren’t', 'They aren’t sleeping.', ['dancing', 'running']],
  ['that', 'is', 'that’s', 'That’s my ball.', ['football']]
]
const shortWords = {
  player: 'squish',
  lines: { ...play, intro: line('Squish two words into one short word.') },
  steps: contractions.map(([first, second, word, sentence, art], index) => ({
    text: `Squish ${first} ${second} into one word.`,
    first,
    second,
    art,
    choices: [word, ...others(contractions, index, 2).map((item) => item[2])],
    answer: word,
    sentence: line(sentence)
  }))
}

const comparisons = [
  ['Who is taller?', 'giraffe', 'giraffe', 'boy', 'boy', 'The giraffe is taller than the boy.'],
  [
    'Which ball is bigger?',
    'football',
    'football',
    'tennis ball',
    'tennis-ball',
    'The football is bigger than the tennis ball.'
  ],
  ['Who is smaller?', 'ant', 'ant', 'cat', 'cat', 'The ant is smaller than the cat.'],
  [
    'Who is faster?',
    'leopard',
    'leopard',
    'turtle',
    'turtle',
    'The leopard is faster than the turtle.'
  ],
  ['Who is slower?', 'snail', 'snail', 'rabbit', 'rabbit', 'The snail is slower than the rabbit.'],
  ['Which is heavier?', 'rock', 'rock', 'leaf', 'leaf', 'The rock is heavier than the leaf.'],
  [
    'Which is lighter?',
    'feather',
    'feather',
    'books',
    'books',
    'The feather is lighter than the books.'
  ],
  ['Which is hotter?', 'fire', 'fire', 'ice', 'ice', 'The fire is hotter than the ice.'],
  [
    'Which is colder?',
    'ice cream',
    'ice-cream',
    'coffee',
    'coffee',
    'The ice cream is colder than the coffee.'
  ],
  [
    'Who is bigger?',
    'elephant',
    'elephant',
    'mouse',
    'mouse',
    'The elephant is bigger than the mouse.'
  ],
  ['Which is longer?', 'snake', 'snake', 'ant', 'ant', 'The snake is longer than the ant.'],
  [
    'Who is heavier?',
    'elephant',
    'elephant',
    'rabbit',
    'rabbit',
    'The elephant is heavier than the rabbit.'
  ],
  ['Who is faster?', 'horse', 'horse', 'snail', 'snail', 'The horse is faster than the snail.'],
  ['Which is taller?', 'tree', 'tree', 'flower', 'flower', 'The tree is taller than the flower.'],
  ['Which is softer?', 'teddy', 'teddy', 'rock', 'rock', 'The teddy is softer than the rock.']
]
const biggerSmaller = {
  player: 'compare',
  lines: { ...play, intro: line('Look at both. Tap the one that fits.') },
  steps: comparisons.map(([text, answer, answerArt, other, otherArt, sentence], index) => ({
    text,
    choices: index % 2 ? [other, answer] : [answer, other],
    art: index % 2 ? [otherArt, answerArt] : [answerArt, otherArt],
    answer,
    sentence: line(sentence)
  }))
}

const places = [
  ['cat', 'box', 'in', ['on', 'under']],
  ['cat', 'box', 'on', ['in', 'beside']],
  ['cat', 'box', 'under', ['on', 'beside']],
  ['dog', 'house', 'beside', ['on', 'behind']],
  ['dog', 'house', 'behind', ['beside', 'on']],
  ['duck', 'chair', 'on', ['under', 'beside']],
  ['mouse', 'chair', 'under', ['on', 'beside']],
  ['ball', 'box', 'in', ['beside', 'on']],
  ['bird', 'tree', 'in', ['under', 'beside']],
  ['rabbit', 'tree', 'in front of', ['behind', 'on']],
  ['cat', 'chair', 'on', ['under', 'beside']],
  ['duck', 'box', 'beside', ['in', 'on']],
  ['dog', 'box', 'in', ['on', 'beside']],
  ['rabbit', 'chair', 'under', ['on', 'beside']],
  ['bird', 'house', 'on', ['behind', 'beside']]
]
const placeArt = { ball: 'football', box: 'box' }
const whereIsIt = {
  player: 'place',
  lines: { ...play, intro: line('Listen, then put it in the right spot.') },
  steps: places.map(([thing, spot, answer, wrong]) => ({
    text: `Put the ${thing} ${answer} the ${spot}.`,
    art: [placeArt[thing] ?? thing, placeArt[spot] ?? spot],
    choices: [answer, ...wrong],
    answer,
    sentence: line(`The ${thing} is ${answer} the ${spot}.`)
  }))
}

const fill = (text, word) => text.replace('…', text.startsWith('…') ? cap(word) : word)
const train = (intro, choices, gaps) => ({
  player: 'train',
  lines: { ...play, intro: line(intro) },
  steps: gaps.map(([text, answer, art]) => ({
    text,
    art: [art],
    choices,
    answer,
    sentence: line(fill(text, answer))
  }))
})
const aOrAn = train(
  'Load a or an on the train.',
  ['a', 'an'],
  [
    ['I see … dog.', 'a', 'dog'],
    ['I have … apple.', 'an', 'apple'],
    ['This is … elephant.', 'an', 'elephant'],
    ['I see … owl.', 'an', 'owl'],
    ['I want … ice cream.', 'an', 'ice-cream'],
    ['This is … cat.', 'a', 'cat'],
    ['I see … ant.', 'an', 'ant'],
    ['This is … umbrella.', 'an', 'umbrella'],
    ['I have … ball.', 'a', 'football'],
    ['This is … octopus.', 'an', 'octopus'],
    ['I want … banana.', 'a', 'banana'],
    ['I have … pen.', 'a', 'pen'],
    ['This is … rocket.', 'a', 'rocket'],
    ['I see … horse.', 'a', 'horse'],
    ['This is … ice cube.', 'an', 'ice']
  ]
)
const aOrThe = train(
  'Load a or the on the train.',
  ['a', 'the'],
  [
    ['I see … dog.', 'a', 'dog'],
    ['… dog is barking.', 'the', 'dog'],
    ['I want … cookie.', 'a', 'cookie'],
    ['… cookie is big.', 'the', 'cookie'],
    ['Open … door.', 'the', 'door'],
    ['… sun is hot.', 'the', 'sun'],
    ['I saw … shooting star.', 'a', 'shooting-star'],
    ['Throw … ball.', 'the', 'basketball'],
    ['I see … horse.', 'a', 'horse'],
    ['… moon is bright.', 'the', 'moon'],
    ['I want … cake.', 'a', 'cake'],
    ['… cake is sweet.', 'the', 'cake'],
    ['I see … turtle.', 'a', 'turtle'],
    ['… turtle is slow.', 'the', 'turtle'],
    ['I have … cycle.', 'a', 'bike']
  ]
)

const questions = [
  ['book', 'closed-book', true],
  ['pen', 'pen', true],
  ['table', 'chair', false, 'No. This is a chair.'],
  ['nose', 'nose', true],
  ['cat', 'fish', false, 'No. This is a fish.'],
  ['shirt', 't-shirt', true],
  ['ball', 'cricket', false, 'No. This is a bat.'],
  ['house', 'house', true],
  ['mountain', 'mountain', true],
  ['spoon', 'knife', false, 'No. This is a knife.'],
  ['horse', 'horse', true],
  ['duck', 'duck', true],
  ['frog', 'rabbit', false, 'No. This is a rabbit.'],
  ['apple', 'apple', true],
  ['car', 'car', true],
  ['fish', 'bird', false, 'No. This is a bird.']
]
const askMe = {
  player: 'yesno',
  lines: { ...play, intro: line('Look and listen. Say yes or no.') },
  steps: questions.map(([thing, art, answer, no]) => ({
    text: `Is this a ${thing}?`,
    art: [art],
    answer,
    sentence: line(answer ? `Yes. This is a ${thing}.` : no)
  }))
}

const reasons = [
  [
    'Why is she holding an umbrella?',
    ['umbrella', 'rain'],
    'it is raining',
    'it is her birthday',
    'She is holding an umbrella because it is raining.'
  ],
  [
    'Why is he covering his ears?',
    ['firecracker'],
    'the cracker is loud',
    'he is hungry',
    'He is covering his ears because the cracker is loud.'
  ],
  [
    'Why do we brush our teeth?',
    ['toothbrush'],
    'to keep them clean',
    'to make them sleepy',
    'We brush our teeth to keep them clean.'
  ],
  [
    'Why do we take a bath?',
    ['bath', 'soap'],
    'to keep our body clean',
    'to go to school',
    'We take a bath to keep our body clean.'
  ],
  [
    'Why is he saving money?',
    ['money', 'toy-car'],
    'to buy a toy car',
    'to wash his hands',
    'He is saving money to buy a toy car.'
  ],
  [
    'Why is she giving a present?',
    ['gift', 'cake'],
    'it is a birthday',
    'it is raining',
    'She is giving a present because it is a birthday.'
  ],
  [
    'Why does he have a plaster?',
    ['bandage'],
    'he hurt his knee',
    'he is happy',
    'He has a plaster because he hurt his knee.'
  ],
  [
    'Why is she combing her hair?',
    ['comb', 'girl'],
    'to make it neat',
    'to make it wet',
    'She is combing her hair to make it neat.'
  ],
  [
    'Why is he sleeping?',
    ['sleeping'],
    'he is tired',
    'he is running',
    'He is sleeping because he is tired.'
  ],
  [
    'Why do we wash our hands?',
    ['soap', 'droplet'],
    'to clean the germs',
    'to make them dirty',
    'We wash our hands to clean the germs.'
  ],
  [
    'Why do we water the plant?',
    ['plant', 'droplet'],
    'so it can grow',
    'so it can walk',
    'We water the plant so it can grow.'
  ],
  [
    'Why do we use a dustbin?',
    ['wastebasket'],
    'to keep the place clean',
    'to play a game',
    'We use a dustbin to keep the place clean.'
  ],
  ['Why do we go to school?', ['school'], 'to learn', 'to sleep', 'We go to school to learn.'],
  ['Why do we use a chair?', ['chair'], 'to sit', 'to cook', 'We use a chair to sit.'],
  ['Why do we eat food?', ['spaghetti'], 'to grow strong', 'to fly', 'We eat food to grow strong.']
]
const why = {
  player: 'why',
  lines: { ...play, intro: line('Be a detective. Find the reason.') },
  steps: reasons.map(([text, art, answer, other, sentence], index) => ({
    text,
    art,
    choices: index % 2 ? [other, answer] : [answer, other],
    answer,
    sentence: line(sentence)
  }))
}

const story = (...pages) => ({
  player: 'story',
  lines: { outro: line('The end. Great reading!') },
  steps: pages.map(([text, art]) => ({ text, art: [art] }))
})

const plural = { football: 'balls', 'ice-cream': 'ice creams', fish: 'fish' }
const singular = { football: 'ball', 'ice-cream': 'ice cream', bike: 'cycle' }
const thisOrThese = {
  player: 'bubbles',
  lines: { ...play, intro: line('Is it one, or many? Pop this or these.') },
  steps: [
    ['football', 1],
    ['duck', 3],
    ['apple', 1],
    ['car', 3],
    ['cat', 1],
    ['football', 3],
    ['duck', 1],
    ['apple', 3],
    ['car', 1],
    ['fish', 3],
    ['banana', 1],
    ['star', 3],
    ['balloon', 1],
    ['cookie', 3],
    ['bird', 1]
  ].map(([art, count]) => {
    const one = singular[art] ?? art
    const many = plural[art] ?? `${one}s`
    const answer = count === 1 ? 'this' : 'these'
    return {
      text: 'This or these?',
      art: Array.from({ length: count }, () => art),
      choices: ['this', 'these'],
      answer,
      sentence: line(count === 1 ? `This is a ${one}.` : `These are ${many}.`)
    }
  })
}

const pronoun = (intro, choices, rows) => ({
  player: 'bubbles',
  lines: { ...play, intro: line(intro) },
  steps: rows.map(([answer, art, doing]) => ({
    text: `Who is ${doing}?`,
    art,
    choices,
    answer,
    sentence: line(`${cap(answer)} ${answer === 'they' ? 'are' : 'is'} ${doing}.`)
  }))
})
const heOrShe = pronoun(
  'Is it a boy or a girl? Pop he or she.',
  ['he', 'she'],
  [
    ['he', ['running'], 'running'],
    ['she', ['girl-reading'], 'reading'],
    ['he', ['eating'], 'eating'],
    ['she', ['girl-jumping'], 'jumping'],
    ['he', ['sleeping'], 'sleeping'],
    ['she', ['girl-waving'], 'waving'],
    ['she', ['dancing'], 'dancing'],
    ['he', ['writing'], 'writing'],
    ['she', ['runner-girl'], 'running'],
    ['he', ['cooking'], 'cooking'],
    ['she', ['girl-eating'], 'eating'],
    ['he', ['singing'], 'singing'],
    ['she', ['girl-sleeping'], 'sleeping'],
    ['he', ['riding'], 'cycling'],
    ['she', ['girl-painting'], 'painting']
  ]
)
const they = pronoun(
  'One child or many? Pop he, she or they.',
  ['he', 'she', 'they'],
  [
    ['they', ['running', 'runner-girl'], 'running'],
    ['he', ['eating'], 'eating'],
    ['they', ['reading', 'girl-reading'], 'reading'],
    ['she', ['girl-jumping'], 'jumping'],
    ['they', ['jumping', 'girl-jumping'], 'jumping'],
    ['they', ['sleeping', 'girl-sleeping'], 'sleeping'],
    ['he', ['waving'], 'waving'],
    ['they', ['waving', 'girl-waving', 'waving'], 'waving'],
    ['she', ['dancing'], 'dancing'],
    ['they', ['eating', 'girl-eating'], 'eating'],
    ['he', ['writing'], 'writing'],
    ['they', ['singing', 'dancing'], 'singing'],
    ['she', ['girl-painting'], 'painting'],
    ['they', ['painting', 'girl-painting'], 'painting'],
    ['he', ['riding'], 'cycling']
  ]
)

export const LESSONS = [
  ['can-and-cant', 'Can and can’t', canAndCant, 'published'],
  ['action-words', 'Action words', actionWords, 'published'],
  ['feelings', 'Feelings', feelings, 'published'],
  ['describing-words', 'Describing words', describingWords, 'published'],
  ['opposites', 'Opposites', opposites, 'published'],
  ['short-words', 'Short words', shortWords, 'published'],
  ['bigger-smaller', 'Bigger and smaller', biggerSmaller, 'published'],
  ['where-is-it', 'Where is it?', whereIsIt, 'published'],
  ['a-or-an', 'Articles, part 1: a or an', aOrAn, 'published'],
  ['a-or-the', 'Articles, part 2: a or the', aOrThe, 'published'],
  ['ask-me', 'Ask me', askMe, 'published'],
  ['why', 'Why?', why, 'published'],
  ['this-these', 'This and these', thisOrThese, 'published'],
  ['he-she', 'He and she', heOrShe, 'draft'],
  ['they', 'He, she and they', they, 'draft'],
  [
    'colours',
    'Colours around us',
    story(
      ['This apple is red.', 'apple'],
      ['This banana is yellow.', 'banana'],
      ['This frog is green.', 'frog'],
      ['This heart is blue.', 'blue-heart'],
      ['This fish is orange.', 'blowfish'],
      ['This leaf is green.', 'leaf'],
      ['This car is blue.', 'car'],
      ['This elephant is grey.', 'elephant'],
      ['This bear is brown.', 'bear'],
      ['This lemon is yellow.', 'lemon'],
      ['This cloud is white.', 'cloud'],
      ['This cake is pink.', 'cake'],
      ['This balloon is red.', 'balloon'],
      ['This ice cream is pink.', 'ice-cream'],
      ['This shirt is blue.', 't-shirt']
    ),
    'published'
  ],
  [
    'morning-routine',
    'My morning routine',
    story(['First, I wake up.', 'sunrise'], ['Then, I brush my teeth.', 'toothbrush']),
    'draft'
  ]
]
