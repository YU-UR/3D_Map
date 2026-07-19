// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 YHY_UNan
// Source: https://github.com/YU_UR/3D_Map

export type Position = [number, number];

export interface GeoFeature {
  type: 'Feature';
  properties: {
    name?: string;
    fullname?: string;
    center?: Position;
    [key: string]: unknown;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: Position[][] | Position[][][];
  };
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}
