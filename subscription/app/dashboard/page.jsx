import moment from "moment/moment";
import { Funnel_Sans } from "next/font/google";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import InputForm from "./inputForm";
import { Pool } from "pg";
import { Pencil, Search } from "lucide-react";
import Link from "next/link";

const funnel_sans = Funnel_Sans({
	variable: "--font-funnel-sans",
	subsets: ["latin"],
});

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASS,
	port: process.env.DB_PORT || 5432,
});

function processData(payments) {
	// This function will take in data, work out if it's coming up soon, and return it in a useful furnat
	var important_payments = [];
	// need to output date, id, amount, name
	payments.forEach((payment) => {
		console.log("Processing payment:", payment);
		var {
			date,
			id,
			amount,
			name,
			frequency,
			business_days_only,
			final_date,
			auto_renew,
			start_date,
		} = payment;
		date = moment(start_date).utc();
		if (final_date) {
			final_date = moment(final_date).utc();
		} else {
			final_date = null;
		}
		if (final_date && final_date.isBefore(moment())) {
			console.log(
				"Skipping payment with id:",
				id,
				"as it has already ended."
			);
			return; // the subscription isnt active
		}
		if (!auto_renew) {
			console.log(
				"Skipping payment with id:",
				id,
				"as it is not set to auto-renew."
			);
			return; // the payment isnt gonna renew so ignore
		}
		// using the date, add the frequency, and check if any occur in the next 14 days
		var next_payment_date = date.clone();
		if (!date.isBefore(moment())) {
			console.log(
				"Payment with id:",
				id,
				"is in the future, using that date."
			);
			next_payment_date = date.clone(); // if the date is in the future, use that as the next payment date
		} else {
			console.log(
				"Payment with id:",
				id,
				"is in the past, calculating next payment date."
			);
			// log frequency
			console.log("Payment frequency is:", frequency);
			while (next_payment_date.isBefore(moment())) {
				switch (frequency) {
					case "daily":
						next_payment_date.add(1, "days");
						break;
					case "weekly":
						next_payment_date.add(1, "weeks");
						break;
					case "bi-weekly":
						next_payment_date.add(2, "weeks");
						break;
					case "monthly":
						next_payment_date.add(1, "months");
						break;
					case "quarterly":
						next_payment_date.add(1, "quarter");
						break;
					case "yearly":
						next_payment_date.add(1, "years");
						break;
					case "one-time":
						next_payment_date = date.clone(); // one-time payments are just the date they were created
						break;
					default:
						console.log(
							"Skipping payment with id:",
							id,
							"as it has an invalid frequency:",
							frequency
						);
						return;
				}
			}
		}
		if (!next_payment_date.isBefore(moment().add(30, "days"))) {
			console.log(
				next_payment_date.format("DD-MM-YYYY"),
				"is not within the next 30 days."
			);
			console.log(
				"Skipping payment with id:",
				id,
				"as it is not coming up in the next 30 days."
			);
			return; // the payment is not coming up soon
		}
		// if the payment is only on business days, check if the next payment date is a business day, and add days until it isn't
		if (business_days_only) {
			while (next_payment_date.isoWeekday() > 5) {
				// 6 = Saturday, 7 = Sunday
				next_payment_date.add(1, "days");
			}
		}
		console.log(
			"Payment with id:",
			id,
			"has original date:",
			date.format("DD-MM-YYYY"),
			"next payment date:",
			next_payment_date.format("DD-MM-YYYY")
		);
		important_payments.push({
			date: next_payment_date,
			id: id,
			amount: parseFloat(amount),
			name: name,
			meta: payment,
		});
	});
	return important_payments;
}

export default async function DashboardPage() {
	const user = await currentUser();
	if (!user) {
		return (
			<div className="w-full h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold">
						Please log in to view your dashboard
					</h1>
				</div>
			</div>
		);
	}
	var data = await pool.query(
		"SELECT * FROM subscriptions WHERE userid = $1 AND status = 'active' AND auto_renew = true AND final_date is null OR final_date > NOW()",
		[user.id]
	);
	console.log("Fetched data:", data.rows);
	const payments = processData(data.rows);
	console.log("Processed payments:", payments);
	// const payments = Array.from({ length: 16 }).map((_, i) => ({
	//     id: i + 1,
	//     date: moment().add(Math.floor(Math.random() * 14) + 1, 'days'),
	//     amount: (Math.random() * 20 + 2).toFixed(2) * 1,
	//     name: paymentNames[Math.floor(Math.random() * paymentNames.length)]
	// }));
	// Sort payments by date
	payments.sort((a, b) => a.date - b.date);
	const groupedPayments = payments.reduce((acc, payment) => {
		const weekStart = payment.date.clone().startOf("week");
		const weekKey = weekStart.format("YYYY-MM-DD");
		if (!acc[weekKey]) {
			acc[weekKey] = [];
		}
		acc[weekKey].push(payment);
		return acc;
	}, {});
	function roundValue(value) {
		let rounded = Math.round(value * 100) / 100;
		return rounded.toFixed(2);
	}
	const currencies = {
		USD: { units: { major: { symbol: "$" } } },
		EUR: { units: { major: { symbol: "€" } } },
		GBP: { units: { major: { symbol: "£" } } },
	};
	function getSymbol() {
		if (!user) return "£";
		const metadata = user.unsafeMetadata || {};
		const currencyCode = metadata.currency || "GBP";
		const currency = currencies[currencyCode];
		return currency ? currency.units.major.symbol : "£";
	}
	return (
		<div className="w-full px-2 mt-4">
			<div className="mapbg max-w-[30cm] mx-auto w-full md:w-1/2 min-w-fit py-4 px-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl">
				<h1 className="text-4xl font-bold text-center">Dashboard</h1>
				<p className="text-center mt-2 text-2xl">
					View your overview here.
				</p>
			</div>
			<div className="mt-8 max-w-[30cm] flex flex-col sm:flex-row items-center justify-center gap-4 w-full md:w-1/2 mx-auto">
				<div className="mapbg w-full relative border-2 border-accent-foreground/40 bg-accent/30 shadow-xl rounded-2xl p-4">
					<h2 className="text-xl font-semibold">This Week</h2>
					<p className={"text-6xl " + funnel_sans.className}>
						{getSymbol()}
						{roundValue(
							groupedPayments[
								moment().startOf("week").format("YYYY-MM-DD")
							]?.reduce(
								(acc, payment) => acc + payment.amount,
								0
							) ?? 0
						)}
					</p>
				</div>
				<div className="mapbg w-full relative border-2 border-accent-foreground/40 bg-accent/30 shadow-xl rounded-2xl p-4">
					<h2 className="text-xl font-semibold">Next Week</h2>
					<p className={"text-6xl " + funnel_sans.className}>
						{getSymbol()}
						{roundValue(
							groupedPayments[
								moment()
									.add(1, "week")
									.startOf("week")
									.format("YYYY-MM-DD")
							]?.reduce(
								(acc, payment) => acc + payment.amount,
								0
							) ?? 0
						)}
					</p>
				</div>
			</div>
			<div className="mapbg max-w-[30cm] w-full md:w-1/2 mx-auto mt-8 p-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl">
				<h2 className="text-2xl font-semibold">Upcoming payments</h2>
				<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
					{payments.map((payment) => (
						<div
							key={payment.id}
							className="flex relative flex-col items-start bg-accent/10 p-4 rounded-lg border-2 border-accent-foreground/40 shadow-md min-w-0 h-50 backdrop-blur-md"
						>
							<h3 className="text-lg font-semibold">
								{payment.name}
							</h3>
							<span>
								{payment.date.format("dddd Do MMMM YYYY")}
							</span>
							<span
								className={
									"text-4xl text-muted-foreground " +
									funnel_sans.className
								}
							>
								{getSymbol()}
								{payment.amount.toFixed(2)}
							</span>
							<div className="bottom-[1rem] absolute flex flex-row items-center justify-between w-full max-w-[90%] flex-wrap">
								<div className="flex flex-row items-center gap-2">
									<Button
										className="cursor-pointer"
										variant={"outline"}
										asChild
									>
										<Link
											href={`/dashboard/payment/${payment.id}/view`}
										>
											<Search />
											<p>View</p>
										</Link>
									</Button>
									<Button
										className="cursor-pointer"
										variant={"outline"}
										asChild
									>
										<Link
											href={`/dashboard/payment/${payment.id}/edit`}
										>
											<Pencil />
											<p>Edit</p>
										</Link>
									</Button>
								</div>
							</div>
						</div>
					))}
					<div className="flex relative flex-col items-start bg-accent/10 p-4 rounded-lg border-2 border-accent-foreground/40 shadow-md h-40 min-w-0 backdrop-blur-md">
						<h3 className="text-lg font-semibold">
							Add subscription
						</h3>
						<Dialog>
							<Button
								className={
									"bottom-[1rem] absolute cursor-pointer"
								}
								asChild
							>
								<DialogTrigger>Add</DialogTrigger>
							</Button>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>
										Add a subscription
									</DialogTitle>
								</DialogHeader>
								<InputForm />
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</div>
		</div>
	);
}
