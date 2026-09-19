import { NextResponse } from "next/server";
import { getBillingStore } from "@/lib/billing/store";

export async function GET() {
  const store = getBillingStore();
  return NextResponse.json({
    ledger: store.ledger,
    receipts: store.receipts,
  });
}
