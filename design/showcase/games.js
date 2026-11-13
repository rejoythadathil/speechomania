const GAMES = [
  { name: 'Feed the shark', topic: 'Action words', line: 'Feed the shark the picture that shows the word.', img: 'img/shark.webp' },
  { name: 'Balloon pop', topic: 'Feelings', line: 'Pop the balloon with the right face.', img: 'img/balloons.webp' },
  { name: 'Word bubbles', topic: 'Describing words', line: 'Catch the bubble with the right word.', img: 'img/bubbles.webp' },
  { name: 'Word train', topic: 'A or an', line: 'Pick the right word for each train car.', img: 'img/train.webp' },
  { name: 'Who can’t?', topic: 'Can and can’t', line: 'Find who can’t do the action.', img: 'img/pick.webp' },
  { name: 'Weigh it up', topic: 'Bigger and smaller', line: 'Which one is bigger? Which one is heavier?', img: 'img/compare.webp' },
  { name: 'Put it there', topic: 'Where is it?', line: 'Put it in, on or under.', img: 'img/place.webp' },
  { name: 'Yes or no', topic: 'Ask me', line: 'Listen to the question and say yes or no.', img: 'img/yesno.webp' }
]

const lock =
  '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'

function gameCard(g) {
  return `<button type="button" class="game" data-game="${g.name}">
    <img src="${g.img}" alt="">
    <span class="body">
      <span class="topic">${g.topic}</span>
      <span class="name">${g.name}</span>
      <span class="line">${g.line}</span>
      <span class="lock">${lock} Sign in to play</span>
    </span>
  </button>`
}

document.body.insertAdjacentHTML(
  'beforeend',
  `<dialog id="signin">
    <img id="signin-img" alt="" hidden>
    <form method="dialog">
      <h2 id="signin-title">Welcome back</h2>
      <p>Sign in with the account your centre gave you.</p>
      <label>Email <input type="email" autocomplete="email"></label>
      <label>Password <input type="password" autocomplete="current-password"></label>
      <button class="btn primary" value="signin">Sign in</button>
      <button class="link-btn" value="close">Keep looking</button>
    </form>
  </dialog>`
)

function openSignIn(name) {
  const game = GAMES.find((g) => g.name === name)
  const img = document.getElementById('signin-img')
  img.hidden = !game
  if (game) img.src = game.img
  document.getElementById('signin-title').textContent = game ? `Sign in to play ${game.name}` : 'Welcome back'
  document.getElementById('signin').showModal()
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-game], [data-signin]')
  if (target) openSignIn(target.dataset.game)
})
