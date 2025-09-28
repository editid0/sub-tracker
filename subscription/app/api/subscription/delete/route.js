import { getAuth } from "@clerk/nextjs/server";
import { Pool } from "pg";

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASS,
	port: process.env.DB_PORT || 5432,
});

export async function DELETE(req) {
	const { userId } = getAuth(req);
	const body = await req.json();
	const { id } = body;

	if (!id) {
		return new Response(JSON.stringify({ error: "ID is required" }), {
			status: 400,
		});
	}
	try {
		const result = await pool.query(
			"DELETE FROM subscriptions WHERE id = $1 AND userid = $2 RETURNING *",
			[id, userId]
		);
		if (result.rowCount === 0) {
			return new Response(
				JSON.stringify({
					error: "Subscription not found or you do not have access to it.",
				}),
				{
					status: 404,
				}
			);
		}
		return new Response(
			JSON.stringify({ message: "Subscription deleted successfully" }),
			{
				status: 200,
			}
		);
	} catch (error) {
		console.error("Error deleting subscription:", error);
		return new Response(
			JSON.stringify({ error: "Internal Server Error" }),
			{
				status: 500,
			}
		);
	}
}
