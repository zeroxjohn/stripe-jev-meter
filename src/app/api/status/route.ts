import { NextResponse } from "next/server";
import { readStackStatus } from "@/lib/stack/status";

export async function GET() {
  return NextResponse.json(readStackStatus());
}
