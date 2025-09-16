import { getAuth } from "@clerk/nextjs/server";
import moment from "moment-timezone";
import { Pool } from "pg";

const allowed_frequencies = [
    "daily",
    "weekly",
    "bi-weekly",
    "monthly",
    "quarterly",
    "yearly",
    "one-time",
]

const allowed_categories = [
    "entertainment",
    "utilities",
    "food",
    "transportation",
    "healthcare",
    "other",
]

const allowed_status = [
    "active",
    "inactive",
    "cancelled",
]

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
});

export async function POST(req) {
    const { userId } = getAuth(req);
    const body = await req.json();
    console.log("Received body:", body);
    var { name, amount, date, frequency, businessDaysOnly, notes, category, paymentMethod, status, autoRenew, finalDate } = body;
    if (!name || !amount || !date || !frequency || !category || !paymentMethod || !status) {
        switch (true) {
            case !name:
                return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });
            case !amount:
                return new Response(JSON.stringify({ error: "Amount is required" }), { status: 400 });
            case !date:
                return new Response(JSON.stringify({ error: "Date is required" }), { status: 400 });
            case !frequency:
                return new Response(JSON.stringify({ error: "Frequency is required" }), { status: 400 });
            case !category:
                return new Response(JSON.stringify({ error: "Category is required" }), { status: 400 });
            case !paymentMethod:
                return new Response(JSON.stringify({ error: "Payment method is required" }), { status: 400 });
            case !status:
                return new Response(JSON.stringify({ error: "Status is required" }), { status: 400 });
        }
    }
    date = moment(date);
    //     {
    //   name: 'netflix',
    //   amount: 10,
    //   date: '2025-07-26T17:50:33.828Z',
    //   frequency: 'monthly',
    //   businessDaysOnly: true,
    //   notes: '',
    //   category: 'entertainment',
    //   paymentMethod: 'card',
    //   status: 'active',
    //   autoRenew: false,
    //   finalDate: null
    // }

    if (!/^[^a-z-A-Z0-9 ]+$/.test(name)) {
        name = name.replace(/[^a-zA-Z0-9 ]/g, '');
    }
    if (name.length > 30 || name.length < 3) {
        return new Response(JSON.stringify({ error: "Name must be between 3 and 30 characters" }), { status: 400 });
    }
    if (isNaN(amount) || amount <= 0) {
        return new Response(JSON.stringify({ error: "Amount must be a positive number" }), { status: 400 });
    }
    if (!allowed_frequencies.includes(frequency)) {
        return new Response(JSON.stringify({ error: "Frequency is not permitted." }), { status: 400 });
    }
    if (date.isBefore(moment())) {
        return new Response(JSON.stringify({ error: "Date cannot be in the past" }), { status: 400 });
    }
    if (typeof businessDaysOnly !== "boolean") {
        return new Response(JSON.stringify({ error: "Business days only must be a boolean" }), { status: 400 });
    }
    if (notes && notes.length > 500) {
        return new Response(JSON.stringify({ error: "Notes cannot exceed 500 characters" }), { status: 400 });
    }
    if (notes && !/^(?:(?!\n{4,})[a-zA-Z0-9 .,!?@#$%^&*()_+\-=\[\]{}|\\;:'",<>\/`~\n])*$/.test(notes)) {
        return new Response(JSON.stringify({ error: "Notes contain invalid characters" }), { status: 400 });
    }
    if (!allowed_categories.includes(category)) {
        return new Response(JSON.stringify({ error: "Category is not permitted." }), { status: 400 });
    }
    if (!/^[^a-z-A-Z0-9 ]+$/.test(paymentMethod)) {
        paymentMethod = paymentMethod.replace(/[^a-zA-Z0-9 ]/g, '');
    }
    if (paymentMethod.length > 20 || paymentMethod.length < 3) {
        return new Response(JSON.stringify({ error: "Payment method must be between 3 and 20 characters" }), { status: 400 });
    }
    if (!allowed_status.includes(status)) {
        return new Response(JSON.stringify({ error: "Status is not permitted." }), { status: 400 });
    }
    if (typeof autoRenew !== "boolean") {
        return new Response(JSON.stringify({ error: "Auto renew must be a boolean" }), { status: 400 });
    }
    if (finalDate && moment(finalDate).isBefore(moment())) {
        return new Response(JSON.stringify({ error: "Final date cannot be in the past" }), { status: 400 });
    }
    if (finalDate && moment(finalDate).isBefore(date)) {
        return new Response(JSON.stringify({ error: "Final date cannot be before the start date" }), { status: 400 });
    }
    // putting this here for future refrence
    // CREATE TABLE subscriptions (
    // id SERIAL PRIMARY KEY,
    // name TEXT NOT NULL,
    // amount NUMERIC(10, 2) NOT NULL,
    // start_date TIMESTAMPTZ NOT NULL,
    // frequency TEXT NOT NULL,
    // business_days_only BOOLEAN NOT NULL,
    // notes TEXT,
    // category TEXT NOT NULL,
    // payment_method TEXT NOT NULL, 
    // status TEXT NOT NULL, 
    // auto_renew BOOLEAN NOT NULL,
    // final_date TIMESTAMPTZ,
    // userid TEXT NOT NULL
    // );
    try {
        const query = `
            INSERT INTO subscriptions (name, amount, start_date, frequency, business_days_only, notes, category, payment_method, status, auto_renew, final_date, userid)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;
        const values = [
            name,
            amount,
            date.toISOString(),
            frequency,
            businessDaysOnly,
            notes || null,
            category,
            paymentMethod,
            status,
            autoRenew,
            finalDate ? moment(finalDate).toISOString() : null,
            userId
        ];
        await pool.query(query, values);
    } catch (error) {
        console.error("Database error:", error);
        return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
    });
}