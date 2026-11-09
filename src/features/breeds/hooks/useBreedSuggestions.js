import { useEffect, useState } from 'react';
import { breedService } from '../services/breedService';
import {
  BREED_SPECIES,
  MIN_SEARCH_LENGTH,
  searchBreeds,
} from '../domain/breeds';

export function useBreedSuggestions(species, text = '') {
  const [loaded, setLoaded] = useState({ species: null, breeds: [] });
  const needsList =
    BREED_SPECIES.includes(species) && text.trim().length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    if (!needsList) return undefined;

    let active = true;
    breedService
      .getBreeds(species)
      .catch(() => [])
      .then((breeds) => {
        if (active) setLoaded({ species, breeds });
      });

    return () => {
      active = false;
    };
  }, [species, needsList]);

  return loaded.species === species ? searchBreeds(loaded.breeds, text) : [];
}
