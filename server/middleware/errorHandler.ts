import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../lib/httpError.js";

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: { code: "ROUTE_NOT_FOUND", message: "The requested API route does not exist." },
  });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof SyntaxError && (error as { status?: number }).status === 400) {
    response.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body must contain valid JSON." },
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    });
    return;
  }

  console.error("Unhandled request error", error);
  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    },
  });
};
