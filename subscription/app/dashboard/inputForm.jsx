"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { useDebounce } from "@uidotdev/usehooks";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CircleCheckBig } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import moment from "moment-timezone";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

function Required() {
	return <span className="text-red-500 transform-[translateX(-6px)]">*</span>;
}

export default function InputForm() {
	// fetch user data to get currency symbol
	const { user, isLoaded } = useUser();
	const [currencySymbol, setCurrencySymbol] = useState("£");

	// state variables for form inputs
	const [name, setName] = useState("");
	const [amount_, setAmount] = useState("");
	const amount = useDebounce(amount_, 500);
	const [date, setDate] = useState(moment().add(1, "day").hour(12).toDate());
	const [frequency, setFrequency] = useState("monthly");
	const [frequencyCount, setFrequencyCount] = useState(1);
	const [frequencyUnit, setFrequencyUnit] = useState("month");
	const [nextBillingDate, setNextBillingDate] = useState(moment());
	const [businessDaysOnly, setBusinessDaysOnly] = useState(true);
	const [notes, setNotes] = useState("");
	const [category, setCategory] = useState("entertainment");
	const [paymentMethod, setPaymentMethod] = useState("Card 1");
	const [status, setStatus] = useState("active");
	const [autoRenew, setAutoRenew] = useState(true);
	const [finalDate, setFinalDate] = useState(null);
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		// using regex, remove all non-numeric characters from amount
		setAmount((prev) => prev.replace(/[^0-9.]/g, ""));
	}, [amount]);

	useEffect(() => {
		if (!user || !isLoaded) return;
		const metadata = user.unsafeMetadata || {};
		const currency = metadata.currency || "GBP"; // default to £ if not set
		const currencies = {
			GBP: "£",
			USD: "$",
			EUR: "€",
		};
		setCurrencySymbol(currencies[currency] || "£");
	}, [isLoaded]);

	useEffect(() => {
		if (!amount) return;
		// format amount to 2 decimal places
		const formattedAmount = parseFloat(amount).toFixed(2);
		setAmount(formattedAmount);
	}, [amount]);

	useEffect(() => {
		if (!date) return;
		let frequencyMap = {
				daily: "day",
				weekly: "week",
				"bi-weekly": "week",
				monthly: "month",
				quarterly: "quarter",
				yearly: "year",
				"one-time": "day",
			},
			frequencyCountMap = {
				daily: 1,
				weekly: 1,
				"bi-weekly": 2,
				monthly: 1,
				quarterly: 3,
				yearly: 12,
				"one-time": 1,
			};
		setFrequencyUnit(frequencyMap[frequency]);
		setFrequencyCount(frequencyCountMap[frequency]);
	}, [frequency]);

	useEffect(() => {
		if (!date || !frequencyCount || !frequencyUnit) return;
		// calculate next billing date based on frequency
		var nextDate = moment(date).add(frequencyCount, frequencyUnit);
		if (businessDaysOnly) {
			// if business days only, find the next business day
			while (nextDate.isoWeekday() > 5) {
				// 6 = Saturday, 7 = Sunday
				nextDate.add(1, "day");
			}
		}
		if (frequency === "one-time") {
			nextDate = moment(date); // for one-time, use the selected date
		}
		setNextBillingDate(nextDate);
	}, [date, frequencyCount, frequencyUnit, businessDaysOnly]);

	function trySubmit() {
		if (!name || !amount || !date || !frequency) {
			alert("Not all required fields are filled out.");
			return;
		}
		const payload = {
			name,
			amount: parseFloat(amount),
			date: moment(date).utc().toISOString(),
			frequency,
			businessDaysOnly,
			notes,
			category,
			paymentMethod,
			status,
			autoRenew,
			finalDate: finalDate ? moment(finalDate).utc().toISOString() : null,
		};
		fetch("/api/subscription", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.success) {
					setSubmitted(true);
					// Reset form fields
					setName("");
					setAmount("");
					setDate(moment().add(1, "day").toDate());
					setFrequency("monthly");
					setNextBillingDate(moment());
					setBusinessDaysOnly(true);
					setNotes("");
					setCategory("");
					setPaymentMethod("");
					setStatus("");
					setAutoRenew(false);
					setFinalDate(null);
				} else {
					alert("Error adding subscription: " + data.error);
				}
			})
			.catch((error) => {
				console.error("Error:", error);
				alert("Error adding subscription. Please try again later.");
			});
	}

	if (submitted) {
		return (
			<div className="text-center">
				<CircleCheckBig size={96} className="text-green-500 mx-auto" />
				<h2 className="text-2xl font-semibold">
					Subscription Added Successfully!
				</h2>
				<p className="mt-2">
					Thank you for adding your subscription, refresh the page to
					see changes.
				</p>
				<Button className="mt-4" onClick={() => setSubmitted(false)}>
					Add Another Subscription
				</Button>
			</div>
		);
	}

	return (
		<>
			<div className="grid w-full max-w-sm items-center gap-1">
				<Label htmlFor="name">
					Name
					<Required />
				</Label>
				<Input
					type="text"
					id="name"
					placeholder="Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
			</div>
			<div className="grid w-full max-w-sm items-center gap-1">
				<Label htmlFor="amount">
					Amount
					<Required />
				</Label>
				<div className="flex flex-row items-center">
					<p className="dark:bg-input/30 border-input h-9 rounded-l-md flex items-center border bg-transparent border-r-0 px-3 py-1 text-base shadow-xs transition-[color,box-shadow] opacity-50">
						{currencySymbol}
					</p>
					<Input
						type="text"
						id="amount"
						placeholder="Amount"
						value={amount_}
						onChange={(e) => setAmount(e.target.value)}
						className={"rounded-l-none w-full"}
					/>
				</div>
			</div>
			<div className="grid w-full max-w-sm items-center gap-1">
				<Label htmlFor="date">
					Next Billing Date
					<Required />
				</Label>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							data-empty={!date}
							className="data-[empty=true]:text-muted-foreground w-fit justify-start text-left font-normal"
						>
							<CalendarIcon />
							{date ? (
								moment(date).format("MMM D, YYYY")
							) : (
								<span>Next billing date</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0">
						<Calendar
							mode="single"
							selected={date}
							onSelect={setDate}
							disabled={(date) => date <= new Date()}
						/>
					</PopoverContent>
				</Popover>
			</div>
			<div className="grid w-full max-w-sm items-center gap-1">
				<Label htmlFor="frequency">
					Frequency
					<Required />
				</Label>
				<Select value={frequency} onValueChange={setFrequency}>
					<SelectTrigger className="w-fit">
						<SelectValue placeholder="Theme" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="daily">Daily</SelectItem>
						<SelectItem value="weekly">Weekly</SelectItem>
						<SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
						<SelectItem value="monthly">Monthly</SelectItem>
						<SelectItem value="quarterly">Quarterly</SelectItem>
						<SelectItem value="yearly">Yearly</SelectItem>
						<SelectItem value="one-time">One-Time</SelectItem>
					</SelectContent>
				</Select>
				<p className="text-muted-foreground text-sm">
					Next billing date:{" "}
					{moment(nextBillingDate).format("MMM D, YYYY")}
				</p>
			</div>
			<div className="flex items-center space-x-2">
				<Switch
					id="business-days-only"
					checked={businessDaysOnly}
					onCheckedChange={setBusinessDaysOnly}
				/>
				<Label htmlFor="business-days-only">Business Days Only</Label>
			</div>
			<div className="grid w-full max-w-sm items-center gap-1">
				<Label htmlFor="notes">Notes</Label>
				<Textarea
					id="notes"
					placeholder="Notes"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
				/>
			</div>
			<div className="grid w-full max-w-sm items-center gap-1">
				<Label htmlFor="category">
					Category
					<Required />
				</Label>
				<Select value={category} onValueChange={setCategory}>
					<SelectTrigger className="w-fit">
						<SelectValue placeholder="Category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="entertainment">
							Entertainment
						</SelectItem>
						<SelectItem value="utilities">Utilities</SelectItem>
						<SelectItem value="food">Food</SelectItem>
						<SelectItem value="transportation">
							Transportation
						</SelectItem>
						<SelectItem value="healthcare">Healthcare</SelectItem>
						<SelectItem value="other">Other</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="grid w-full max-w-sm items-center gap-1">
				<Label htmlFor="payment-method">
					Payment Method
					<Required />
				</Label>
				<Input
					type="text"
					id="payment-method"
					placeholder="Payment Method"
					value={paymentMethod}
					onChange={(e) => setPaymentMethod(e.target.value)}
				/>
			</div>
			<div className="grid w-full max-w-sm items-center gap-1">
				<Label htmlFor="status">
					Status
					<Required />
				</Label>
				<Select value={status} onValueChange={setStatus}>
					<SelectTrigger className="w-fit">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="active">Active</SelectItem>
						<SelectItem value="inactive">Inactive</SelectItem>
						<SelectItem value="cancelled">Cancelled</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="flex items-center space-x-2">
				<Switch
					id="auto-renew"
					checked={autoRenew}
					onCheckedChange={setAutoRenew}
				/>
				<Label htmlFor="auto-renew">Auto Renew</Label>
			</div>
			<div className="grid w-full max-w-sm items-center gap-1">
				<Label htmlFor="final-date">Final Date</Label>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							data-empty={!finalDate}
							className="data-[empty=true]:text-muted-foreground w-fit justify-start text-left font-normal"
						>
							<CalendarIcon />
							{finalDate ? (
								moment(finalDate).format("MMM D, YYYY")
							) : (
								<span>Last payment date</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0">
						<Calendar
							mode="single"
							selected={finalDate}
							onSelect={setFinalDate}
							disabled={(date) => date <= new Date()}
						/>
					</PopoverContent>
				</Popover>
			</div>
			<Button className="mt-4 cursor-pointer" onClick={trySubmit}>
				Submit
			</Button>
		</>
	);
}
