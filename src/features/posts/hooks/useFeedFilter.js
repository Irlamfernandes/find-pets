import { useState } from 'react';
import {
  ALL_SPECIES,
  EMPTY_FILTER,
  filterPosts,
  isFiltering,
} from '../domain/feedFilter';

export function useFeedFilter(posts) {
  const [filter, setFilter] = useState(EMPTY_FILTER);

  const setSpecies = (species) =>
    setFilter((current) => ({
      ...current,
      species: species === ALL_SPECIES ? '' : species,
    }));

  const setText = (text) => setFilter((current) => ({ ...current, text }));

  return {
    species: filter.species || ALL_SPECIES,
    text: filter.text,
    setSpecies,
    setText,
    clear: () => setFilter(EMPTY_FILTER),
    isFiltering: isFiltering(filter),
    posts: filterPosts(posts, filter),
  };
}
