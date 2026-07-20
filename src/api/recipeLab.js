/**
 * 食验室 · 灵感灶 API
 */
import { get, post } from './request'

const BASE = '/recipe-lab'

export function getAllRecipes() {
  return get(`${BASE}/recipes`)
}

export function recommend(data) {
  return post(`${BASE}/recommend`, data)
}

export function randomRecipe(data) {
  return post(`${BASE}/random`, data)
}
