import { NextResponse } from "next/server";
import { getMatchDetail } from "@/lib/cricket";
import type { MatchDetailApiResponse } from "@/lib/cricket/contracts";
import { toApiError } from "@/lib/cricket/errors";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await getMatchDetail(id);

    const response: MatchDetailApiResponse = {
      ok: true,
      generatedAt: new Date().toISOString(),
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    const apiError = toApiError(error);
    const response: MatchDetailApiResponse = {
      ok: false,
      generatedAt: new Date().toISOString(),
      error: {
        code: apiError.code,
        message: apiError.message,
      },
    };

    return NextResponse.json(response, { status: apiError.status });
  }
}
