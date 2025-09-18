import { getAuth } from "@clerk/nextjs/server";
import moment from "moment/moment";
import { Pool } from "pg";

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASS,
	port: process.env.DB_PORT || 5432,
});

export async function PUT(req) {
	const { userId } = getAuth(req);
	const body = await req.json();
	var {
		id,
		name,
		amount,
		start_date,
		frequency,
		business_days_only,
		notes,
		category,
		payment_method,
		status,
		auto_renew,
		final_date,
	} = body;
	start_date = moment(String(start_date).trim(), "DD/MM/YYYY", true);
	final_date = final_date
		? moment(String(final_date).trim(), "DD/MM/YYYY", true)
		: null;
	if (
		!name ||
		!amount ||
		!start_date ||
		!frequency ||
		!category ||
		!payment_method ||
		!status
	) {
		switch (true) {
			case !name:
				return new Response(
					JSON.stringify({ error: "Name is required" }),
					{ status: 400 }
				);
			case !amount:
				return new Response(
					JSON.stringify({ error: "Amount is required" }),
					{ status: 400 }
				);
			case !start_date:
				return new Response(
					JSON.stringify({ error: "Start date is required" }),
					{ status: 400 }
				);
			case !frequency:
				return new Response(
					JSON.stringify({ error: "Frequency is required" }),
					{ status: 400 }
				);
			case !category:
				return new Response(
					JSON.stringify({ error: "Category is required" }),
					{ status: 400 }
				);
			case !payment_method:
				return new Response(
					JSON.stringify({ error: "Payment method is required" }),
					{ status: 400 }
				);
			case !status:
				return new Response(
					JSON.stringify({ error: "Status is required" }),
					{ status: 400 }
				);
		}
	}
	if (name.length > 100) {
		return new Response(
			JSON.stringify({ error: "Name must be less than 100 characters" }),
			{ status: 400 }
		);
	}
	if (name.length < 3) {
		return new Response(
			JSON.stringify({ error: "Name must be at least 3 characters" }),
			{ status: 400 }
		);
	}
	name = name.replace(/[^a-zA-Z0-9]/g, " ").trim();
	if (isNaN(amount) || amount <= 0) {
		return new Response(
			JSON.stringify({ error: "Amount must be a positive number" }),
			{ status: 400 }
		);
	}
	if (notes && notes.length > 500) {
		return new Response(
			JSON.stringify({ error: "Notes must be less than 500 characters" }),
			{ status: 400 }
		);
	}
	const validFrequencies = [
		"daily",
		"weekly",
		"bi-weekly",
		"monthly",
		"quarterly",
		"yearly",
		"one-time",
	];
	if (!validFrequencies.includes(frequency)) {
		return new Response(
			JSON.stringify({ error: "Invalid frequency value" }),
			{ status: 400 }
		);
	}
	const validCategories = [
		"entertainment",
		"utilities",
		"food",
		"transportation",
		"healthcare",
		"other",
	];
	if (!validCategories.includes(category)) {
		return new Response(
			JSON.stringify({ error: "Invalid category value" }),
			{ status: 400 }
		);
	}
	payment_method = payment_method.replace(/[^a-zA-Z0-9 ]/g, "").trim();
	if (payment_method.length > 50) {
		return new Response(
			JSON.stringify({
				error: "Payment method must be less than 50 characters",
			}),
			{ status: 400 }
		);
	}
	if (payment_method.length < 3) {
		return new Response(
			JSON.stringify({
				error: "Payment method must be at least 3 characters",
			}),
			{ status: 400 }
		);
	}
	const validStatuses = ["active", "inactive", "canceled"];
	const client = await pool.connect();
	try {
		const res = await client.query(
			"SELECT * FROM subscriptions WHERE id = $1 AND userid = $2",
			[id, userId]
		);
		if (res.rows.length === 0) {
			return new Response(
				JSON.stringify({ error: "Subscription not found" }),
				{ status: 404 }
			);
		}
	} catch (error) {
		console.error("Error checking subscription existence:", error);
		return new Response(
			JSON.stringify({ error: "Internal Server Error" }),
			{ status: 500 }
		);
	}
	if (!start_date || !start_date.isValid()) {
		return new Response(JSON.stringify({ error: "Invalid start date" }), {
			status: 400,
		});
	}
	start_date = start_date.utc().format("YYYY-MM-DD");
	if (final_date) {
		if (!final_date.isValid()) {
			return new Response(
				JSON.stringify({ error: "Invalid final date" }),
				{ status: 400 }
			);
		}
		final_date = final_date.utc().format("YYYY-MM-DD");
	} else {
		final_date = null;
	}
	try {
		const query = `
			UPDATE subscriptions
			SET name = $1,
				amount = $2,
				start_date = $3,
				frequency = $4,
				business_days_only = $5,
				notes = $6,
				category = $7,
				payment_method = $8,
				status = $9,
				auto_renew = $10,
				final_date = $11
			WHERE id = $12 AND userid = $13
			RETURNING *;
		`;
		const values = [
			name,
			amount,
			start_date,
			frequency,
			business_days_only,
			notes || null,
			category,
			payment_method,
			status,
			auto_renew,
			final_date || null,
			id,
			userId,
		];
		const result = await client.query(query, values);
		return new Response(JSON.stringify(result.rows[0]), { status: 200 });
	} catch (error) {
		console.error("Error updating subscription:", error);
		return new Response(
			JSON.stringify({ error: "Internal Server Error" }),
			{ status: 500 }
		);
	} finally {
		client.release();
	}
}
