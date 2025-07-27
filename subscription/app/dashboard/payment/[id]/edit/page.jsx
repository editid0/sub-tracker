import { currentUser } from "@clerk/nextjs/server";
import { Pool } from "pg";
import EditableFields from "./editableFields";

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
});

export default async function EditPaymentPage({ params }) {
    const { id } = await params;
    const user = await currentUser();

    let data;

    try {
        data = await pool.query(
            "SELECT * FROM subscriptions WHERE id = $1 AND userid = $2",
            [id, user.id]
        );
    } catch (error) {
        console.error("Error fetching subscription data:", error);
        return <div className="text-center">Error loading subscription data.</div>;
    }

    if (data.rows.length === 0) {
        return <div className="text-center">Subscription not found or you do not have access to it.</div>;
    }

    return (
        <>
            <div className="mapbg max-w-[30cm] mx-auto w-full md:w-1/2 min-w-fit py-4 px-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl my-2">
                <h1 className="text-4xl font-bold text-center">Edit Subscription</h1>
                <p className="text-center text-lg text-muted-foreground">Edit the details of your subscription below.</p>
            </div>
            <div className="mapbg max-w-[30cm] mx-auto w-full md:w-1/2 min-w-fit py-4 px-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl my-2">
                <EditableFields subscription={data.rows[0]} />
            </div>
        </>
    );
}