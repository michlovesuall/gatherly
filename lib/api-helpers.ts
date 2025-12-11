import { NextResponse } from "next/server";

export interface ErrorResponse {
  ok: false;
  error: string;
}

export interface SuccessResponse<T = unknown> {
  ok: true;
  data?: T;
  message?: string;
}

export function createErrorResponse(
  error: string,
  status: number = 400
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { ok: false, error },
    { status }
  );
}

export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    { ok: true, data, message },
    { status }
  );
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

