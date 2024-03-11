// https://vike.dev/data
export { data }
export type Data = Awaited<ReturnType<typeof data>>

import fetch from 'node-fetch'
import type { MovieDetails } from '../types'
import type { PageContextServer } from 'vike/types'

const data = async (pageContext: PageContextServer) => {
  const response = await fetch(`https://brillout.github.io/star-wars/api/films/${pageContext.routeParams.id}.json`)
  let movie = (await response.json()) as MovieDetails
  // We remove data we don't need because the data is passed to the client; we should
  // minimize what is sent over the network.
  movie = minimizeData(movie)
  return movie
}

function minimizeData(movie: MovieDetails & Record<string, unknown>): MovieDetails {
  const { id, title, release_date, director, producer } = movie
  movie = { id, title, release_date, director, producer }
  return movie
}
