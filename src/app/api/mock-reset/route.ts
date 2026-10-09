import { NextResponse } from "next/server";
import { resetMockData } from "@/lib/mocks/mockData";

/**
 * Test-only endpoint: restores the in-memory mock store to its seed values so
 * serial Playwright tests start from a pristine state (the browser test suite
 * runs with MSW off against these real routes).
 */
export async function POST() {
  resetMockData();
  return NextResponse.json({ ok: true });
}