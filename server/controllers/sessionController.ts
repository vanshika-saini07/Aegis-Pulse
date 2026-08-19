import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../lib/httpError.js";
import {
  checkInSchema,
  createSessionSchema,
  idSchema,
  locationSchema,
  shareCodeSchema,
  sosSchema,
} from "../schemas/sessionSchemas.js";
import * as sessionService from "../services/sessionService.js";

function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "Please correct the highlighted fields.",
      result.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  return result.data;
}

function route(handler: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response, next: NextFunction) => {
    handler(request, response).catch(next);
  };
}

export const createSession = route(async (request, response) => {
  const input = parse(createSessionSchema, request.body);
  const session = await sessionService.createSession(input);
  response.status(201).json({ data: session });
});

export const getSession = route(async (request, response) => {
  const shareCode = parse(shareCodeSchema, request.params.shareCode);
  const session = await sessionService.getSessionByShareCode(shareCode);
  response.json({ data: session });
});

export const checkIn = route(async (request, response) => {
  const id = parse(idSchema, request.params.id);
  const input = parse(checkInSchema, request.body ?? {});
  const session = await sessionService.checkIn(id, input);
  response.json({ data: session });
});

export const updateLocation = route(async (request, response) => {
  const id = parse(idSchema, request.params.id);
  const input = parse(locationSchema, request.body);
  const session = await sessionService.updateLocation(id, input);
  response.json({ data: session });
});

export const triggerSos = route(async (request, response) => {
  const id = parse(idSchema, request.params.id);
  const input = parse(sosSchema, request.body ?? {});
  const session = await sessionService.triggerSos(id, input);
  response.json({ data: session });
});

export const completeSession = route(async (request, response) => {
  const id = parse(idSchema, request.params.id);
  const session = await sessionService.completeSession(id);
  response.json({ data: session });
});
