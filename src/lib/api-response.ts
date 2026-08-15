import { NextResponse } from "next/server";

interface ApiResponseOptions {
  success: boolean;
  message: string;
  requestId?: string;
  data?: unknown;
  meta?: Record<string, unknown>;
  errors?: unknown;
  status?: number;
}

/**
 * Standardized API response builder.
 * Guarantees a unique requestId and metadata object are included in all responses.
 */
export function createApiResponse(options: ApiResponseOptions) {
  // Generate request ID in format req_<hexString>
  const requestId = options.requestId || "req_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);

  return NextResponse.json(
    {
      success: options.success,
      requestId,
      message: options.message,
      data: options.data ?? null,
      meta: options.meta ?? {},
      errors: options.errors ?? null,
    },
    { status: options.status ?? (options.success ? 200 : 400) }
  );
}
