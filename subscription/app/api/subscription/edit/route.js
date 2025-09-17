import { getAuth } from "@clerk/nextjs/server";
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
		userid,
		final_date,
	} = body;
	if (userId !== userid) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});
	}
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
	console.log("Received body:", body);
	return new Response(
		JSON.stringify({ message: "PUT request received", userId, body }),
		{ status: 200 }
	);
}
