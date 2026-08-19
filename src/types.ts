export type SessionStatus = "ACTIVE" | "SAFE" | "OVERDUE" | "SOS";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH";

export type EventType =
  | "SESSION_STARTED"
  | "CHECK_IN"
  | "LOCATION_UPDATE"
  | "SOS_TRIGGERED"
  | "OVERDUE"
  | "COMPLETED";

export interface SafetyEvent {
  id: string;
  sessionId: string;
  type: EventType;
  latitude: number | null;
  longitude: number | null;
  message: string | null;
  createdAt: string;
}

export interface RiskAssessment {
  id: string;
  riskLevel: RiskLevel;
  summary: string;
  contributingFactors: string[];
  safetyActions: string[];
  recommendedCheckInMinutes: number;
  modelName: string;
  createdAt: string;
}

export interface SafetySession {
  id: string;
  ownerName: string;
  destination: string;
  travelMode: string;
  durationMinutes: number;
  trustedContactName: string;
  trustedContactPhone: string;
  shareCode: string;
  status: SessionStatus;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastCheckInAt: string;
  nextCheckInAt: string;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  events: SafetyEvent[];
  latestRiskAssessment: RiskAssessment | null;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CreateSessionPayload {
  ownerName: string;
  destination: string;
  durationMinutes: number;
  travelMode: "WALKING" | "CYCLING" | "PUBLIC_TRANSPORT" | "CAR" | "OTHER";
  trustedContactName: string;
  trustedContactPhone: string;
  latitude?: number;
  longitude?: number;
}

export interface RiskAssessmentPayload {
  travelMode?: CreateSessionPayload["travelMode"];
  context?: string;
}
