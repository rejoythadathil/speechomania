import { db } from '../../../../../common-service/db/service/index.js'
import { pageArray } from '../../../../../common-service/http/utils/index.js'
import {
  BADGE_SHARE,
  FRIENDS,
  MEDAL_SHARE,
  STARS_PER_FRIEND
} from '../../learning/constants/index.js'
import { pickGames, totals } from '../utils/index.js'

const published = () =>
  db.lessons.findMany({
    where: { status: 'published' },
    select: { slug: true, title: true, content: true }
  })

export async function summary() {
  return {
    ...totals(await published()),
    stars_per_friend: STARS_PER_FRIEND,
    medal_share: MEDAL_SHARE,
    trophy_share: BADGE_SHARE,
    friends: FRIENDS
  }
}

export async function games({ players, ...window }) {
  return pageArray(pickGames(await published(), players), window)
}
