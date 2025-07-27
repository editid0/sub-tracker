import { Pool } from "pg";

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
});

export default async function EditPaymentPage({ params }) {
    const { id } = await params;
    return (
        <div>
            <h1>Edit Payment Page</h1>
            <p>Payment ID: {id}</p>
        </div>
    );
}