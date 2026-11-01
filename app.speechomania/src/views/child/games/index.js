import { BalloonsGame } from './balloons.jsx'
import { BubblesGame } from './bubbles.jsx'
import { CompareGame } from './compare.jsx'
import { MatchGame } from './match.jsx'
import { PickGame } from './pick.jsx'
import { PlaceGame } from './place.jsx'
import { SharkGame } from './shark.jsx'
import { SquishGame } from './squish.jsx'
import { StoryGame } from './story.jsx'
import { TrainGame } from './train.jsx'
import { WhyGame } from './why.jsx'
import { YesNoGame } from './yesno.jsx'

export const GAMES = {
  story: StoryGame,
  pick: PickGame,
  shark: SharkGame,
  balloons: BalloonsGame,
  bubbles: BubblesGame,
  match: MatchGame,
  squish: SquishGame,
  compare: CompareGame,
  place: PlaceGame,
  train: TrainGame,
  yesno: YesNoGame,
  why: WhyGame
}

export { shuffle } from './use-round.js'
