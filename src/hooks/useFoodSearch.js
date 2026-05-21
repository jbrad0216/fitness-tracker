import { useState, useEffect, useRef, useCallback } from 'react';

const USDA_KEY = 'DEMO_KEY';
const USDA_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const OFF_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

function parseUSDA(item) {
  const nutrients = item.foodNutrients || [];
  const get = (name) => {
    const n = nutrients.find(n =>
      n.nutrientName?.toLowerCase().includes(name.toLowerCase())
    );
    return n ? Math.round(n.value || 0) : 0;
  };
  return {
    id: `usda-${item.fdcId}`,
    name: item.description || 'Unknown',
    brand: item.brandOwner || item.brandName || '',
    cal: get('Energy') || get('energy'),
    protein: get('Protein'),
    fat: get('Total lipid'),
    carbs: get('Carbohydrate'),
    fiber: get('Fiber'),
    sodium: get('Sodium'),
    serving: item.servingSize ? `${item.servingSize}${item.servingSizeUnit || 'g'}` : '100g',
    source: 'usda',
  };
}

function parseOFF(item) {
  const n = item.nutriments || {};
  return {
    id: `off-${item.code || Math.random()}`,
    name: item.product_name || item.generic_name || 'Unknown',
    brand: item.brands || '',
    cal: Math.round(n['energy-kcal_100g'] || n['energy_100g'] / 4.184 || 0),
    protein: Math.round(n.proteins_100g || 0),
    fat: Math.round(n.fat_100g || 0),
    carbs: Math.round(n.carbohydrates_100g || 0),
    fiber: Math.round(n.fiber_100g || 0),
    sodium: Math.round((n.sodium_100g || 0) * 1000),
    serving: item.serving_size || '100g',
    source: 'off',
  };
}

export function useFoodSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const sig = abortRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      // Try USDA first
      const usdaRes = await fetch(
        `${USDA_URL}?query=${encodeURIComponent(q)}&api_key=${USDA_KEY}&pageSize=8&dataType=Survey%20%28FNDDS%29,SR%20Legacy,Branded`,
        { signal: sig }
      );
      if (usdaRes.ok) {
        const data = await usdaRes.json();
        const items = (data.foods || []).slice(0, 8).map(parseUSDA);
        setResults(items);
        setLoading(false);
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
    }

    // Fallback to Open Food Facts
    try {
      const offRes = await fetch(
        `${OFF_URL}?search_terms=${encodeURIComponent(q)}&json=1&page_size=8&fields=product_name,brands,nutriments,serving_size,code,generic_name`,
        { signal: sig }
      );
      if (offRes.ok) {
        const data = await offRes.json();
        const items = (data.products || [])
          .filter(p => p.product_name)
          .slice(0, 8)
          .map(parseOFF);
        setResults(items);
      } else {
        setResults([]);
        setError('Search unavailable — enter manually');
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setResults([]);
        setError('Search unavailable — enter manually');
      }
    } finally {
      if (!sig.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query || query.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(() => search(query), 500);
    return () => clearTimeout(timerRef.current);
  }, [query, search]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  return { query, setQuery, results, loading, error, clear };
}
