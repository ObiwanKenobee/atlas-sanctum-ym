
export type ProjectEvidenceType =
  | 'field_observation' | 'survey' | 'administrative_record' | 'sensor_reading'
  | 'remote_sensing' | 'photograph' | 'document' | 'interview' | 'assessment' | 'other'

export type ProjectEvidenceSourceType =
  | 'person' | 'organization' | 'dataset' | 'document' | 'device' | 'satellite'
  | 'field_visit' | 'public_record' | 'other'

export type ProjectEvidenceInput = {
  placeId: string
  evidenceType: ProjectEvidenceType
  title: string
  description: string
  sourceType: ProjectEvidenceSourceType
  sourceName: string
  sourceReference: string | null
  sourceUrl: string | null
  collectedAt: string
  collectionMethod: string
  limitations: string
}

export type ProjectEvidenceValidation =
  | { ok: true; value: ProjectEvidenceInput }
  | { ok: false; field: string; code: string }

export declare function parseProjectEvidenceInput(input: unknown): ProjectEvidenceValidation
