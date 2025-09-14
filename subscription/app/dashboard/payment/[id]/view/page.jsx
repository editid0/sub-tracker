import { currentUser } from "@clerk/nextjs/server";
import { Pool } from "pg";
import moment from "moment-timezone";
import { Textarea } from "@/components/ui/textarea";

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
});

function processSubscription(subscription) {
    const name = subscription.name || "Unknown Subscription";
    const amount = parseFloat(subscription.amount) || 0;
    const start_date = moment(subscription.start_date);
    const frequency = subscription.frequency || "monthly";
    const business_days_only = subscription.business_days_only || false;
    const notes = subscription.notes || "";
    const category = subscription.category || "Uncategorized";
    const payment_method = subscription.payment_method || "Unknown";
    const status = subscription.status || "active";
    const autorenew = subscription.auto_renew || false;
    const final_date = subscription.final_date ? moment(subscription.final_date) : null;

    let nextPayments = [];
    if (autorenew && start_date.isValid() && ((final_date && final_date.isAfter(moment())) || !final_date) && status === "active") {
        if (start_date.isAfter(moment())) {
            nextPayments.push(start_date.format("YYYY-MM-DD"));
        }
        for (let i = 1; i <= 3; i++) {
            let nextPaymentDate = moment(start_date)
            switch (frequency) {
                case "daily":
                    nextPaymentDate.add(i, 'days');
                    break;
                case "weekly":
                    nextPaymentDate.add(i, 'weeks');
                    break;
                case "bi-weekly":
                    nextPaymentDate.add(i * 2, 'weeks');
                    break;
                case "monthly":
                    nextPaymentDate.add(i, 'months');
                    break;
                case "quarterly":
                    nextPaymentDate.add(i, 'quarter');
                    break;
                case "yearly":
                    nextPaymentDate.add(i, 'years');
                    break;
                case "one-time":
                    if (i === 1) {
                        nextPaymentDate = moment(start_date);
                    } else {
                        continue;
                    }
                    break;
                default:
                    nextPaymentDate.add(i, 'months');
            }
            if (business_days_only) {
                while (nextPaymentDate.isoWeekday() > 5) {
                    nextPaymentDate.add(1, 'days');
                }
            }
            if (nextPaymentDate.isBefore(moment())) continue;
            nextPayments.push(nextPaymentDate.format("YYYY-MM-DD"));
        }
        if (nextPayments.length > 3) {
            nextPayments = nextPayments.slice(0, 3);
        }
    }

    return {
        id: subscription.id,
        name,
        amount,
        start_date: start_date.format("YYYY-MM-DD"),
        frequency,
        business_days_only,
        notes,
        category,
        payment_method,
        status,
        autorenew,
        final_date: final_date ? final_date.format("YYYY-MM-DD") : null,
        nextPayments,
    }
}

const nameToLogo = {
    "netflix": "/logos/netflix.png",
    "spotify": "/logos/spotify.png",
    "youtube": "/logos/youtube.png",
    "amazon prime": "/logos/amazonprime.png",
    "hulu": "/logos/hulu.png",
}

function TextOrLogo({ name }) {
    const logo = nameToLogo[name.toLowerCase()];
    if (logo) {
        return (
            <div className="flex flex-col items-center bg-accent/90 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
                <img src={logo} alt={`${name} logo`} className="w-[10rem]" />
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center bg-accent/90 px-6 py-2 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
            <span className="text-2xl font-semibold">{name}</span>
        </div>
    );
}

export default async function ViewPaymentPage({ params }) {
    const { id } = await params;
    const user = await currentUser();
    const currencyMap = {
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
    }
    const getSymbol = () => {
        const currency = user?.unsafeMetadata?.currency || "GBP";
        return currencyMap[currency] || "£";
    }

    if (!user) {
        return (
            <div>
                <h1>Unauthorized</h1>
                <p>You must be logged in to view this page.</p>
            </div>
        );
    }

    let data;
    try {
        data = await pool.query('SELECT * FROM subscriptions WHERE id = $1 AND userid = $2', [id, user.id]);
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return (
            <div>
                <h1>Error</h1>
                <p>There was an error fetching the subscription information.</p>
            </div>
        );
    }
    if (data.rows.length === 0) {
        return (
            <div>
                <h1>Not Found</h1>
                <p>No subscription found with ID: {id}</p>
            </div>
        );
    }
    const subscription = data.rows[0];
    const processedSubscription = processSubscription(subscription);

    return (
        <div className="w-full px-2 mt-4">
            <div className="mapbg max-w-[30cm] mx-auto w-full md:w-1/2 min-w-fit py-4 px-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl my-2">
                <h1 className="font-semibold text-center text-4xl">View a Subscription</h1>
                <p className="text-center text-lg mt-2">View information about a subscription here.</p>
            </div>
            <div className="mapbg max-w-[30cm] mx-auto w-full md:w-1/2 min-w-fit py-4 px-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl my-2">
                <h2 className="text-2xl font-semibold mb-4">Subscription Details</h2>
                <div className="flex flex-col md:flex-row items-center justify-around my-4 max-w-[100%] gap-2">
                    <TextOrLogo name={processedSubscription.name} />
                    <div className="flex flex-col items-center bg-accent/90 px-6 py-2 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
                        <p className="text-lg text-muted-foreground font-semibold">Amount</p>
                        <p>{getSymbol()}{processedSubscription.amount.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-center bg-accent/90 px-6 py-2 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
                        <p className="text-lg text-muted-foreground font-semibold">Started</p>
                        <p>{moment(processedSubscription.start_date).format("MMMM Do YYYY")}</p>
                    </div>
                    <div className="flex flex-col items-center bg-accent/90 px-6 py-2 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
                        <p className="text-lg text-muted-foreground font-semibold">Frequency</p>
                        <p className="first-letter:uppercase">{processedSubscription.frequency}</p>
                    </div>
                    <div className="flex flex-col items-center bg-accent/90 px-6 py-2 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
                        <p className="text-lg text-muted-foreground font-semibold">Auto renew</p>
                        <p className="first-letter:uppercase">{processedSubscription.autorenew ? "Enabled" : "Disabled"}</p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-around my-4 max-w-[100%] gap-2">
                    <div className="flex flex-col items-center bg-accent/90 px-6 py-2 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
                        <p className="text-lg text-muted-foreground font-semibold text-center md:text-left">Business days only</p>
                        <p className="first-letter:uppercase">{processedSubscription.business_days_only ? "Yes" : "No"}</p>
                    </div>
                    <div className="flex flex-col items-center bg-accent/90 px-6 py-2 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
                        <p className="text-lg text-muted-foreground font-semibold">Category</p>
                        <p className="first-letter:uppercase">{processedSubscription.category}</p>
                    </div>
                    <div className="flex flex-col items-center bg-accent/90 px-6 py-2 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
                        <p className="text-lg text-muted-foreground font-semibold">Status</p>
                        <p className="first-letter:uppercase">{processedSubscription.status}</p>
                    </div>
                    <div className="flex flex-col items-center bg-accent/90 px-6 py-2 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
                        <p className="text-lg text-muted-foreground font-semibold text-center md:text-left">Payment method</p>
                        <p className="first-letter:uppercase">{processedSubscription.payment_method}</p>
                    </div>
                    {processSubscription.final_date && (
                        <div className="flex flex-col items-center bg-accent/90 px-6 py-2 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
                            <p className="text-lg text-muted-foreground font-semibold">Final date</p>
                            <p className="first-letter:uppercase">{processedSubscription.final_date || "N/A"}</p>
                        </div>
                    )}
                </div>
                {processedSubscription.notes && (
                    <Textarea
                        value={processedSubscription.notes}
                        readOnly
                        placeholder="No note provided"
                    />)}
                {processedSubscription.nextPayments.length > 0 && (
                    <>
                        <h3 className="mt-4 text-xl font-semibold text-center">Next Payments</h3>
                        <div className="flex flex-wrap justify-center gap-4 mt-2">
                            {processedSubscription.nextPayments.map((date, index) => (
                                <div key={index} className="flex flex-col items-center bg-accent/90 px-6 py-2 rounded-lg shadow-md border-2 w-[50%] md:w-auto">
                                    <p>{moment(date).format("MMMM Do YYYY")}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}