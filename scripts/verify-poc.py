#!/usr/bin/env python3
"""Hit the running demo and assert every fixture decision plus reopen."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://localhost:3000"

FIXTURES = [
    {
        "id": "confirmed-resolution",
        "terminal": "confirmed",
        "messages": [
            {"role": "customer", "text": "When does order 1842 arrive?"},
            {
                "role": "agent",
                "text": "Order 1842 ships tomorrow via UPS. Tracking will email tonight.",
            },
            {"role": "customer", "text": "Thanks, that answers it."},
        ],
        "baseline": ("bill", "full"),
        "semantic": ("bill", "full"),
        "quote": 0.99,
    },
    {
        "id": "quiet-resolution",
        "terminal": "left",
        "messages": [
            {"role": "customer", "text": "What is the return window?"},
            {
                "role": "agent",
                "text": "You have 30 days from delivery. Start a return from Orders.",
            },
        ],
        "baseline": ("bill", "full"),
        "semantic": ("bill", "full"),
        "quote": 0.99,
    },
    {
        "id": "abandon-weak",
        "terminal": "left",
        "messages": [
            {
                "role": "customer",
                "text": "Where is order 1842 and can I still change the delivery address?",
            },
            {"role": "agent", "text": "Thanks for reaching out! I am looking into this."},
        ],
        "baseline": ("bill", "full"),
        "semantic": ("withhold", None),
        "quote": 0,
    },
    {
        "id": "partial-answer",
        "terminal": "left",
        "messages": [
            {
                "role": "customer",
                "text": "I need tracking for 1842 and a refund on the damaged mug.",
            },
            {
                "role": "agent",
                "text": "Tracking is 1Z999. I do not have a refund decision yet.",
            },
        ],
        "baseline": ("bill", "full"),
        "semantic": ("bill", "partial"),
        "quote": 0.4,
    },
    {
        "id": "silent-correction",
        "terminal": "self_fixed",
        "messages": [
            {"role": "customer", "text": "My login is locked after the reset email bounced."},
            {
                "role": "agent",
                "text": "Just use the Forgot password link on the login page.",
            },
        ],
        "baseline": ("bill", "full"),
        "semantic": ("withhold", None),
        "quote": 0,
    },
    {
        "id": "failed-refund",
        "terminal": "left",
        "messages": [
            {"role": "customer", "text": "Refund the $48 mug. It arrived cracked."},
            {
                "role": "agent",
                "text": "Done. I processed a $48 refund to your original payment method.",
            },
        ],
        "baseline": ("bill", "full"),
        "semantic": ("withhold", None),
        "quote": 0,
    },
]


def post(path: str, payload: dict) -> dict:
    request = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(payload).encode(),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode())


def grade_of(decision: dict) -> str | None:
    return decision.get("grade") if decision.get("kind") == "bill" else None


def check(name: str, ok: bool, detail: str) -> None:
    mark = "ok" if ok else "FAIL"
    print(f"{mark}  {name}: {detail}")
    if not ok:
        raise SystemExit(1)


def main() -> None:
    try:
        with urllib.request.urlopen(f"{BASE}/api/status") as response:
            status = json.loads(response.read().decode())
    except urllib.error.URLError as error:
        raise SystemExit(f"Demo is not running on {BASE}: {error}") from error

    print(
        "stack",
        status["billingAdapter"],
        status["evaluatorAdapter"],
        status["projects"],
    )

    for fixture in FIXTURES:
        result = post(
            "/api/evaluate",
            {
                "conversationId": f"conv_{fixture['id']}_verify",
                "scenarioId": fixture["id"],
                "terminal": fixture["terminal"],
                "messages": fixture["messages"],
            },
        )
        if "price" in (result.get("evaluation") or {}):
            check(fixture["id"], False, "Jev returned a price")
        check(
            fixture["id"],
            result["baseline"]["kind"] == fixture["baseline"][0]
            and grade_of(result["baseline"]) == fixture["baseline"][1]
            and result["decision"]["kind"] == fixture["semantic"][0]
            and grade_of(result["decision"]) == fixture["semantic"][1]
            and result["quoteUsd"] == fixture["quote"],
            f"baseline={result['baseline']['kind']}/{grade_of(result['baseline'])} "
            f"semantic={result['decision']['kind']}/{grade_of(result['decision'])} "
            f"quote={result['quoteUsd']}",
        )

    first = post(
        "/api/evaluate",
        {
            "conversationId": "conv_quiet-resolution_verify_reopen",
            "scenarioId": "quiet-resolution",
            "terminal": "left",
            "messages": FIXTURES[1]["messages"],
        },
    )
    billed = first["decision"].get("billingEventId")
    second = post(
        "/api/evaluate",
        {
            "conversationId": "conv_quiet-resolution_verify_reopen",
            "scenarioId": "quiet-resolution",
            "terminal": "reopen",
            "messages": FIXTURES[1]["messages"]
            + [{"role": "customer", "text": "That was wrong. I still need help."}],
        },
    )
    reversed = next((row for row in second["ledger"] if row.get("kind") == "reversed"), None)
    check(
        "reopen",
        bool(reversed)
        and reversed.get("reverses") == billed
        and reversed.get("reason") == "customer_reopen"
        and second["quoteUsd"] == 0,
        f"reverses={reversed and reversed.get('reverses')} quote={second['quoteUsd']}",
    )
    print("PoC HTTP acceptance passed against the running demo.")


if __name__ == "__main__":
    sys.exit(main())
