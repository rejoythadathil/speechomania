import { HttpError } from '../../../../../common-service/http/exception/index.js'

export const notFlashcards = () =>
  new HttpError(400, 'Only flashcard lessons (part 1) can be printed as cards')
