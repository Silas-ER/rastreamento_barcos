import { NextResponse } from "next/server";

export class ApiHttpError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export function errorResponse(status: number, detail: string) {
  return NextResponse.json({ detail }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiHttpError) {
    return errorResponse(err.status, err.detail);
  }
  console.error(err);
  return errorResponse(500, "Erro interno do servidor.");
}
