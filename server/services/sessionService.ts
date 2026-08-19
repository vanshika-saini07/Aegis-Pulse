import crypto from "node:crypto";
import {
  Prisma,
  SafetyEventType,
  SessionStatus,
  type SafetySession,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { serializeRiskAssessment } from "./riskAssessmentService.js";
import type {
  CheckInInput,
  CreateSessionInput,
  LocationInput,
  SosInput,
} from "../schemas/sessionSchemas.js";

const sessionWithEvents = {
  events: {
    orderBy: { createdAt: "desc" as const },
    take: 30,
  },
  riskAssessments: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
};

function serializeSession<T extends { riskAssessments: Parameters<typeof serializeRiskAssessment>[0][] }>(session: T) {
  const { riskAssessments, ...base } = session;
  return { ...base, latestRiskAssessment: serializeRiskAssessment(riskAssessments[0] ?? null) };
}

function nextCheckIn(now: Date, durationMinutes: number) {
  const intervalMinutes = Math.min(15, durationMinutes);
  return new Date(now.getTime() + intervalMinutes * 60_000);
}

function createShareCode() {
  return crypto.randomBytes(18).toString("base64url");
}

function assertActionable(session: SafetySession) {
  if (session.status === SessionStatus.SAFE) {
    throw new HttpError(409, "SESSION_COMPLETED", "This journey is already complete.");
  }
  if (session.status === SessionStatus.SOS) {
    throw new HttpError(409, "SOS_ALREADY_ACTIVE", "SOS is already active for this journey.");
  }
}

async function findSessionOrThrow(tx: Prisma.TransactionClient, id: string) {
  const session = await tx.safetySession.findUnique({ where: { id } });
  if (!session) {
    throw new HttpError(404, "SESSION_NOT_FOUND", "Safety session not found.");
  }
  return session;
}

async function getFullSession(tx: Prisma.TransactionClient, id: string) {
  const session = await tx.safetySession.findUnique({
    where: { id },
    include: sessionWithEvents,
  });
  if (!session) {
    throw new HttpError(404, "SESSION_NOT_FOUND", "Safety session not found.");
  }
  return serializeSession(session);
}

export async function createSession(input: CreateSessionInput) {
  const now = new Date();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const session = await prisma.safetySession.create({
        data: {
          ownerName: input.ownerName,
          destination: input.destination,
          durationMinutes: input.durationMinutes,
          travelMode: input.travelMode,
          trustedContactName: input.trustedContactName,
          trustedContactPhone: input.trustedContactPhone,
          shareCode: createShareCode(),
          status: SessionStatus.ACTIVE,
          lastLatitude: input.latitude ?? null,
          lastLongitude: input.longitude ?? null,
          lastCheckInAt: now,
          nextCheckInAt: nextCheckIn(now, input.durationMinutes),
          startedAt: now,
          events: {
            create: {
              type: SafetyEventType.SESSION_STARTED,
              latitude: input.latitude ?? null,
              longitude: input.longitude ?? null,
              message: `Journey to ${input.destination} started`,
            },
          },
        },
        include: sessionWithEvents,
      });
      return serializeSession(session);
    } catch (error) {
      const isShareCodeCollision =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!isShareCodeCollision || attempt === 4) throw error;
    }
  }

  throw new Error("Unable to create a unique share code");
}

export async function getSessionByShareCode(shareCode: string) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.safetySession.findUnique({ where: { shareCode } });
    if (!session) {
      throw new HttpError(404, "SESSION_NOT_FOUND", "Safety session not found.");
    }

    const now = new Date();
    if (session.status === SessionStatus.ACTIVE && session.nextCheckInAt <= now) {
      const result = await tx.safetySession.updateMany({
        where: {
          id: session.id,
          status: SessionStatus.ACTIVE,
          nextCheckInAt: { lte: now },
        },
        data: { status: SessionStatus.OVERDUE },
      });

      if (result.count === 1) {
        await tx.safetyEvent.create({
          data: {
            sessionId: session.id,
            type: SafetyEventType.OVERDUE,
            message: "Required safety check-in was missed",
          },
        });
      }
    }

    return getFullSession(tx, session.id);
  });
}

export async function checkIn(id: string, input: CheckInInput) {
  return prisma.$transaction(async (tx) => {
    const session = await findSessionOrThrow(tx, id);
    assertActionable(session);
    const now = new Date();

    await tx.safetySession.update({
      where: { id },
      data: {
        status: SessionStatus.ACTIVE,
        lastCheckInAt: now,
        nextCheckInAt: nextCheckIn(now, session.durationMinutes),
        ...(input.latitude != null
          ? { lastLatitude: input.latitude, lastLongitude: input.longitude }
          : {}),
      },
    });
    await tx.safetyEvent.create({
      data: {
        sessionId: id,
        type: SafetyEventType.CHECK_IN,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        message: session.status === SessionStatus.OVERDUE ? "Safety restored after overdue check-in" : "User checked in safe",
      },
    });
    return getFullSession(tx, id);
  });
}

export async function updateLocation(id: string, input: LocationInput) {
  return prisma.$transaction(async (tx) => {
    const session = await findSessionOrThrow(tx, id);
    assertActionable(session);
    await tx.safetySession.update({
      where: { id },
      data: { lastLatitude: input.latitude, lastLongitude: input.longitude },
    });
    await tx.safetyEvent.create({
      data: {
        sessionId: id,
        type: SafetyEventType.LOCATION_UPDATE,
        latitude: input.latitude,
        longitude: input.longitude,
        message: "Location refreshed",
      },
    });
    return getFullSession(tx, id);
  });
}

export async function triggerSos(id: string, input: SosInput) {
  return prisma.$transaction(async (tx) => {
    const session = await findSessionOrThrow(tx, id);
    if (session.status === SessionStatus.SAFE) {
      throw new HttpError(409, "SESSION_COMPLETED", "This journey is already complete.");
    }

    if (session.status !== SessionStatus.SOS) {
      const now = new Date();
      await tx.safetySession.update({
        where: { id },
        data: {
          status: SessionStatus.SOS,
          ...(input.latitude != null
            ? { lastLatitude: input.latitude, lastLongitude: input.longitude }
            : {}),
          updatedAt: now,
        },
      });
      await tx.safetyEvent.create({
        data: {
          sessionId: id,
          type: SafetyEventType.SOS_TRIGGERED,
          latitude: input.latitude ?? session.lastLatitude,
          longitude: input.longitude ?? session.lastLongitude,
          message: input.message ?? "Emergency SOS activated",
        },
      });
    }
    return getFullSession(tx, id);
  });
}

export async function completeSession(id: string) {
  return prisma.$transaction(async (tx) => {
    const session = await findSessionOrThrow(tx, id);
    if (session.status === SessionStatus.SOS) {
      throw new HttpError(409, "SOS_ACTIVE", "Resolve the active SOS before completing this journey.");
    }
    if (session.status !== SessionStatus.SAFE) {
      await tx.safetySession.update({
        where: { id },
        data: { status: SessionStatus.SAFE, endedAt: new Date() },
      });
      await tx.safetyEvent.create({
        data: {
          sessionId: id,
          type: SafetyEventType.COMPLETED,
          latitude: session.lastLatitude,
          longitude: session.lastLongitude,
          message: "Journey completed safely",
        },
      });
    }
    return getFullSession(tx, id);
  });
}
