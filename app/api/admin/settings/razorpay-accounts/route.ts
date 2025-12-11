import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    try {
        const accounts = []

        // Check how many accounts are configured in ENV
        const accountCount = parseInt(process.env.RAZORPAY_ACCOUNT_COUNT || "2")

        for (let i = 1; i <= accountCount; i++) {
            const keyId = process.env[`RAZORPAY_ACCOUNT_${i}_KEY_ID`]
            const label = process.env[`RAZORPAY_ACCOUNT_${i}_LABEL`] || `Account ${i}`

            if (keyId) {
                accounts.push({
                    accountNumber: i.toString(),
                    label: label,
                    keyId: keyId, // Public key, safe to expose
                    // Never expose key_secret
                })
            }
        }

        if (accounts.length === 0) {
            return NextResponse.json(
                { error: "No Razorpay accounts configured" },
                { status: 500 }
            )
        }

        return NextResponse.json({ accounts })
    } catch (error) {
        console.error("Failed to fetch Razorpay accounts:", error)
        return NextResponse.json(
            { error: "Failed to fetch Razorpay accounts" },
            { status: 500 }
        )
    }
}
