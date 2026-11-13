
export type ProjectPlaceType =
  | 'county' | 'sub_county' | 'ward' | 'village' | 'community' | 'settlement'
  | 'facility' | 'water_point' | 'catchment' | 'protected_area' | 'landscape' | 'other'

export type ProjectPlaceInput = {
  name: string
  slug: string
  placeType: ProjectPlaceType
  administrativeArea: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
}

export type ProjectPlaceValidation =
  | { ok: true; value: ProjectPlaceInput }
  | { ok: false; field: string; code: string }

export declare function parseProjectPlaceInput(input: unknown): ProjectPlaceValidation
