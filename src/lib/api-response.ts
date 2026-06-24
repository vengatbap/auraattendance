import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  data: T;
  error: null;
};

export type ApiFailure = {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ data, error: null }, init);
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiFailure>(
    { data: null, error: { code, message, details } },
    { status }
  );
}
