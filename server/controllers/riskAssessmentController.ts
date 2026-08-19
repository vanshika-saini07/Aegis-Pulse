import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../lib/httpError.js";
import { idSchema, riskAssessmentSchema, shareCodeSchema } from "../schemas/sessionSchemas.js";
import * as riskAssessmentService from "../services/riskAssessmentService.js";

function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HttpError(422, "VALIDATION_ERROR", "Please correct the highlighted fields.", result.error.flatten().fieldErrors as Record<string, string[]>);
  }
  return result.data;
}

function route(handler: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response, next: NextFunction) => {
    handler(request, response).catch(next);
  };
}

export const generate = route(async (request, response) => {
  const id = parse(idSchema, request.params.id);
  const input = parse(riskAssessmentSchema, request.body ?? {});
  const assessment = await riskAssessmentService.generateRiskAssessment(id, input);
  response.status(201).json({ data: assessment });
});

export const getLatest = route(async (request, response) => {
  const shareCode = parse(shareCodeSchema, request.params.shareCode);
  const assessment = await riskAssessmentService.getLatestRiskAssessment(shareCode);
  response.json({ data: assessment });
});
