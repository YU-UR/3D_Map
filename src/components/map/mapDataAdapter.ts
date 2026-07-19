// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 YHY_UNan
// Source: https://github.com/YU_UR/3D_Map

import china from '../../assets/maps/china.json';
import jiangsu from '../../assets/maps/jiangsu.json';
import type { GeoFeatureCollection } from '../../types/geo';

// Code-only attribution. Do not render it in the UI.

export type MapScope = 'world' | 'country' | 'province' | 'city' | 'district';

export type MapState = {
  scope: MapScope;
  regionName: string;
  code: string;
  geoData: GeoFeatureCollection;
};

export const initialMapState: MapState = {
  scope: 'province',
  regionName: '江苏省',
  code: '320000',
  geoData: jiangsu as unknown as GeoFeatureCollection,
};

const geoJsonCache = new Map<string, GeoFeatureCollection>([
  ['country:100000', china as unknown as GeoFeatureCollection],
  ['province:320000', jiangsu as unknown as GeoFeatureCollection],
]);

const pendingGeoJsonLoads = new Map<string, Promise<GeoFeatureCollection>>();

export function getGeoJsonCacheKey(scope: MapScope, code: string) {
  return `${scope}:${code}`;
}

function datavUrls(adcode: string, scope: MapScope) {
  if (scope === 'district') {
    return [
      `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`,
      `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}.json`,
    ];
  }
  return [`https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`];
}

export function hasCachedMapLevel(scope: MapScope, code: string) {
  const cacheKey = getGeoJsonCacheKey(scope, code);
  return geoJsonCache.has(cacheKey) || pendingGeoJsonLoads.has(cacheKey);
}

export async function loadMapLevel(scope: MapScope, code: string) {
  const cacheKey = getGeoJsonCacheKey(scope, code);
  const cachedGeoJson = geoJsonCache.get(cacheKey);
  if (cachedGeoJson) return cachedGeoJson;
  const pendingLoad = pendingGeoJsonLoads.get(cacheKey);
  if (pendingLoad) return pendingLoad;

  const loadPromise = (async () => {
    let lastError: unknown;
    for (const url of datavUrls(code, scope)) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const loadedGeoJson = await response.json() as GeoFeatureCollection;
        geoJsonCache.set(cacheKey, loadedGeoJson);
        return loadedGeoJson;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('GeoJSON load failed');
  })();

  pendingGeoJsonLoads.set(cacheKey, loadPromise);
  try {
    return await loadPromise;
  } finally {
    pendingGeoJsonLoads.delete(cacheKey);
  }
}

export function prefetchMapLevel(scope: MapScope, code: string) {
  if (hasCachedMapLevel(scope, code)) return;
  void loadMapLevel(scope, code).catch(() => undefined);
}
