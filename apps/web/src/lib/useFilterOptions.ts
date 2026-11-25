import { useCallback, useEffect, useState } from 'react';
import { getFilterOptions } from '../api/employees';
import type { FilterOptions } from '../api/types';

/** Dropdown values (countries, departments, job titles) taken from the data. Failures leave the lists empty. */
export function useFilterOptions() {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const refresh = useCallback(() => {
    getFilterOptions()
      .then(setOptions)
      .catch(() => undefined);
  }, []);
  useEffect(refresh, [refresh]);
  return { options, refresh };
}
