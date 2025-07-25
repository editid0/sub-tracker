import moment from "moment-timezone";

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

export async function POST(req) {
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
    if (!/^(?:(?!\n{4,})[a-zA-Z0-9 .,!?@#$%^&*()_+\-=\[\]{}|\\;:'",<>\/`~\n])*$ /.test(notes)) {
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
    return new Response(JSON.stringify({ success: true }), {
        status: 200,
    });
}