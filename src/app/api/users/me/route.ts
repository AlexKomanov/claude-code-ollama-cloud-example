import { NextResponse } from "next/server";
import { MOCK_USERS } from "@/lib/mocks/mockData";

export async function GET() {
  return NextResponse.json(MOCK_USERS[0]); // Default to Admin
}