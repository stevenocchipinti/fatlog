import type { NewSymptomEpisode, SymptomEpisode } from "@/types"

/** A symptom episode as stored at `/symptomEpisodes/<profileId>/<id>`. */
export type StoredSymptomEpisode = {
  symptom: string
  start: number
  end?: number
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
  ...(record.note ? { note: record.note } : {}),
})

/** The record to store: the database rejects `undefined`, so a missing end or blank note is omitted. */
export const toSymptomEpisodeRecord = ({
  symptom,
  start,
  end,
  note,
}: NewSymptomEpisode): StoredSymptomEpisode => {
  const trimmedNote = note?.trim()
  return {
    symptom: symptom.trim(),
    start,
    ...(end !== undefined ? { end } : {}),
    ...(trimmedNote ? { note: trimmedNote } : {}),
  }
}

const newestStartFirst = (a: SymptomEpisode, b: SymptomEpisode) =>
  b.start - a.start

/**
 * Episodes split for the screen: ongoing ones (no end) to pin at the top, and
 * past ones below. Each group lists the most recently started first.
 */
export const splitOngoingAndPast = (
  episodes: readonly SymptomEpisode[],
): { ongoing: SymptomEpisode[]; past: SymptomEpisode[] } => {
  const sorted = [...episodes].sort(newestStartFirst)
  return {
    ongoing: sorted.filter(episode => episode.end === undefined),
    past: sorted.filter(episode => episode.end !== undefined),
  }
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
