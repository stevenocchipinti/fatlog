import type { LocalDate, NewSymptomEpisode, SymptomEpisode } from "@/types"

import { addDays, toLocalDate } from "@/lib/localDate"

/** A symptom episode as stored at `/symptomEpisodes/<profileId>/<id>`. */
export type StoredSymptomEpisode = {
  symptom: string
  start: number
  end?: number
  emoji?: string
  note?: string
}

export const parseSymptomEpisode = (
  id: string,
  record: StoredSymptomEpisode,
): SymptomEpisode => ({
  id,
  symptom: record.symptom,
  start: record.start,
  ...(record.end !== undefined ? { end: record.end } : {}),
  ...(record.emoji ? { emoji: record.emoji } : {}),
  ...(record.note ? { note: record.note } : {}),
})

/**
 * The first character of what was typed, as the eye sees it: an emoji built
 * from several code points (a flag, a skin tone, a family) stays whole.
 * Empty when nothing but whitespace was typed.
 */
export const firstEmoji = (typed: string): string => {
  const [first] = new Intl.Segmenter().segment(typed.trim())
  return first?.segment ?? ""
}

/** The record to store: the database rejects `undefined`, so a missing end, emoji or note is omitted. */
export const toSymptomEpisodeRecord = ({
  symptom,
  start,
  end,
  emoji,
  note,
}: NewSymptomEpisode): StoredSymptomEpisode => {
  const trimmedEmoji = firstEmoji(emoji ?? "")
  const trimmedNote = note?.trim()
  return {
    symptom: symptom.trim(),
    start,
    ...(end !== undefined ? { end } : {}),
    ...(trimmedEmoji ? { emoji: trimmedEmoji } : {}),
    ...(trimmedNote ? { note: trimmedNote } : {}),
  }
}

const newestStartFirst = (a: SymptomEpisode, b: SymptomEpisode) =>
  b.start - a.start

/** Whether an episode ended the moment it started: a point in time, not a period. */
export const isOneOff = ({ start, end }: SymptomEpisode): boolean =>
  end === start

/** One day's stretch of an episode that lasted a while. */
export type SymptomBar = {
  episode: SymptomEpisode
  /** The episode started on this day. */
  startsHere: boolean
  /** The episode ended on this day or, if it is ongoing, has reached today. */
  endsHere: boolean
}

export type SymptomDay = {
  /** Every episode touching the day, most recently started first. */
  episodes: SymptomEpisode[]
  /** The one-offs among them. */
  oneOffs: SymptomEpisode[]
  /**
   * The episodes that lasted a while, by lane. An episode keeps one lane for
   * its whole run so its bar lines up from day to day; a lane it doesn't use
   * on a given day is left empty.
   */
  bars: (SymptomBar | undefined)[]
}

/**
 * What to show on each local day that has any symptoms. A one-off sits on its
 * own day. Any other episode covers every day from its start to its end, and
 * an ongoing one runs through `today`.
 */
export const symptomDays = (
  episodes: readonly SymptomEpisode[],
  today: LocalDate,
): Map<LocalDate, SymptomDay> => {
  const days = new Map<LocalDate, SymptomDay>()
  const dayFor = (date: LocalDate) => {
    let day = days.get(date)
    if (!day) days.set(date, (day = { episodes: [], oneOffs: [], bars: [] }))
    return day
  }
  // The last day each lane is taken up to.
  const lanes: LocalDate[] = []

  // Oldest first, so an episode that overlaps an earlier one stacks above it.
  for (const episode of [...episodes].sort(newestStartFirst).reverse()) {
    const first = toLocalDate(new Date(episode.start))
    if (isOneOff(episode)) {
      const day = dayFor(first)
      day.episodes.unshift(episode)
      day.oneOffs.unshift(episode)
      continue
    }
    const ended =
      episode.end === undefined ? today : toLocalDate(new Date(episode.end))
    const last = ended < first ? first : ended
    let lane = lanes.findIndex(takenTo => takenTo < first)
    if (lane === -1) lane = lanes.length
    lanes[lane] = last
    for (let date = first; date <= last; date = addDays(date, 1)) {
      const day = dayFor(date)
      day.episodes.unshift(episode)
      day.bars[lane] = {
        episode,
        startsHere: date === first,
        endsHere: date === last,
      }
    }
  }
  return days
}

/**
 * Past symptom names to suggest while typing a new one, from this profile's
 * episodes only. Names that differ only by case count as one (shown as most
 * recently spelled), most recently used first. Matches anywhere in the name,
 * ignoring case, and leaves out a name that is already exactly what was typed.
 */
export const suggestSymptomNames = (
  episodes: readonly SymptomEpisode[],
  typed: string,
  limit = 5,
): string[] => {
  const query = typed.trim()
  const lowerQuery = query.toLowerCase()
  const seen = new Set<string>()
  const names: string[] = []
  for (const { symptom } of [...episodes].sort(newestStartFirst)) {
    const key = symptom.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    if (key.includes(lowerQuery) && symptom !== query) names.push(symptom)
  }
  return names.slice(0, limit)
}

/**
 * The emoji last used for a symptom of this name (ignoring case), so picking
 * a past name brings its emoji with it. Empty if it never had one.
 */
export const lastEmojiFor = (
  episodes: readonly SymptomEpisode[],
  name: string,
): string => {
  const key = name.trim().toLowerCase()
  const last = [...episodes]
    .sort(newestStartFirst)
    .find(({ symptom }) => symptom.toLowerCase() === key)
  return last?.emoji ?? ""
}

/** The episode as it should be stored once ended at `now`; an end never precedes the start. */
export const endEpisodeNow = (
  { id: _id, ...episode }: SymptomEpisode,
  now: number,
): NewSymptomEpisode => ({ ...episode, end: Math.max(now, episode.start) })

/** Whether an episode's end is earlier than its start, which can't be saved. */
export const isEndBeforeStart = ({
  start,
  end,
}: Pick<NewSymptomEpisode, "start" | "end">): boolean =>
  end !== undefined && end < start
