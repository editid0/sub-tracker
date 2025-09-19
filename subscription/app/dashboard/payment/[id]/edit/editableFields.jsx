"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import { useDebounce } from "@uidotdev/usehooks";
import { ChevronDownIcon, LoaderCircle } from "lucide-react";
import moment from "moment-timezone";
import { useEffect, useState } from "react";

export default function EditableFields({ subscription }) {
	const { user, isLoaded } = useUser();
	const [currencySymbol, setCurrencySymbol] = useState("£");

	// all the fields
	const [name, setName] = useState(subscription.name || "");
	const [startDate, setStartDate] = useState(
		subscription.start_date
			? moment(subscription.start_date).utc()
			: moment().hour(12).utc()
	);
	const [amount_, setAmount] = useState(subscription.amount || "");
	const amount = useDebounce(amount_, 500);
	const [frequency, setFrequency] = useState(
		subscription.frequency || "monthly"
	);
	const [frequencyCount, setFrequencyCount] = useState(1);
	const [frequencyUnit, setFrequencyUnit] = useState("month");
	const [nextBillingDate, setNextBillingDate] = useState(moment());
	const [businessDaysOnly, setBusinessDaysOnly] = useState(
		subscription.business_days_only || false
	);
	const [notes, setNotes] = useState(subscription.notes || "");
	const [category, setCategory] = useState(subscription.category || "Other");
	const [paymentMethod, setPaymentMethod] = useState(
		subscription.payment_method || "Credit Card"
	);
	const [status, setStatus] = useState(subscription.status || "active");
	const [autoRenew, setAutoRenew] = useState(subscription.auto_renew || true);
	const [finalDate, setFinalDate] = useState(subscription.final_date || null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isLoaded && user) {
			const userCurrency = user.unsafeMetadata.currency || "£";
			setCurrencySymbol(userCurrency);
		}
	}, [isLoaded, user]);

	function submitChanges() {
		setLoading(true);
		setTimeout(() => {
			setLoading(false);
		}, 1000);
		fetch(`/api/subscription/edit`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				id: subscription.id,
				name,
				start_date: startDate ? startDate.toISOString() : null,
				amount: parseFloat(amount) || 0,
				frequency,
				business_days_only: businessDaysOnly,
				notes,
				category,
				payment_method: paymentMethod,
				status,
				auto_renew: autoRenew,
				final_date: finalDate,
			}),
		})
			.then((res) => {
				if (res.ok) {
					setLoading(false);
				} else {
					// get json body
					const data = res.json();
					console.error(JSON.stringify(data));
				}
			})
			.catch((error) => {
				console.error("Error updating subscription:", error);
			});
	}

	useEffect(() => {
		switch (frequency) {
			case "daily":
				setFrequencyCount(1);
				setFrequencyUnit("day");
				break;
			case "weekly":
				setFrequencyCount(1);
				setFrequencyUnit("week");
				break;
			case "bi-weekly":
				setFrequencyCount(2);
				setFrequencyUnit("week");
				break;
			case "monthly":
				setFrequencyCount(1);
				setFrequencyUnit("month");
				break;
			case "quarterly":
				setFrequencyCount(1);
				setFrequencyUnit("quarter");
				break;
			case "yearly":
				setFrequencyCount(1);
				setFrequencyUnit("year");
				break;
			case "one-time":
				setFrequencyCount(1);
				setFrequencyUnit("day");
				break;
			default:
				setFrequencyCount(1);
				setFrequencyUnit("month");
				break;
		}
		if (!businessDaysOnly) {
			setNextBillingDate(
				startDate.clone().add(frequencyCount, frequencyUnit)
			);
		} else {
			let nextDate = startDate.clone().add(frequencyCount, frequencyUnit);
			while (nextDate.isoWeekday() > 5) {
				// Skip weekends
				nextDate.add(1, "day");
			}
			setNextBillingDate(nextDate);
		}
	}, [frequency, startDate]);

	return (
		<>
			<div className="flex flex-col md:flex-row gap-x-6 md:gap-x-12 items-end flex-wrap max-w-[25cm] gap-y-4">
				<div className="flex flex-col w-full md:w-auto flex-shrink-0">
					<label className="font-medium" htmlFor="subscription-name">
						Subscription Name
					</label>
					<Input
						id="subscription-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Subscription Name"
						className={"max-w-fit"}
					/>
				</div>
				<div className="flex flex-col gap-1 w-full md:w-auto flex-shrink-0">
					<Label htmlFor="date" className="px-1">
						Start of Billing Cycle
					</Label>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								id="date"
								className="w-48 justify-between font-normal"
							>
								{startDate
									? startDate.utc().format("MMMM D, YYYY")
									: "Select date"}
								<ChevronDownIcon />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							className="w-auto overflow-hidden p-0"
							align="start"
						>
							<Calendar
								mode="single"
								selected={startDate.toDate()}
								captionLayout="dropdown"
								onSelect={(date) => {
									setStartDate(moment(date).hour(12).utc());
								}}
							/>
						</PopoverContent>
					</Popover>
				</div>
				<div className="flex flex-col gap-1 w-full md:w-auto flex-shrink-0">
					<label className="font-medium" htmlFor="amount">
						Amount ({currencySymbol})
					</label>
					<Input
						id="amount"
						type="number"
						value={amount_}
						onChange={(e) => setAmount(e.target.value)}
						placeholder="Amount"
						className={"max-w-fit"}
					/>
				</div>
				<div className="flex flex-col gap-1 w-full md:w-auto flex-shrink-0">
					<Label htmlFor="frequency" className="px-1">
						Billing Frequency
					</Label>
					<Select
						value={frequency}
						onValueChange={(value) => setFrequency(value)}
						id="frequency"
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Frequency" />
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
				</div>
				<div className="flex flex-col gap-1 w-full md:w-auto flex-shrink-0">
					<Label htmlFor="next-billing-date" className="px-1">
						Status
					</Label>
					<Select
						value={status}
						onValueChange={(value) => setStatus(value)}
						id="status"
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
							<SelectItem value="cancelled">Cancelled</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1 w-full md:w-auto flex-shrink-0">
					<Label htmlFor="category" className="px-1">
						Category
					</Label>
					<Select
						value={category}
						onValueChange={(value) => setCategory(value)}
						id="category"
					>
						<SelectTrigger className="w-[180px]">
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
							<SelectItem value="healthcare">
								Healthcare
							</SelectItem>
							<SelectItem value="other">Other</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1 w-full md:w-auto flex-shrink-0">
					<Label htmlFor="payment-method" className="px-1">
						Payment Method
					</Label>
					<Input
						id="payment-method"
						value={paymentMethod}
						onChange={(e) => setPaymentMethod(e.target.value)}
						placeholder="Payment Method"
						className={"max-w-fit"}
					/>
				</div>
			</div>
			<div className="flex flex-col md:flex-row gap-x-6 md:gap-x-12 items-end flex-wrap max-w-[25cm] gap-y-4 mt-4">
				<div className="flex flex-row gap-1 w-full md:w-auto flex-shrink-0">
					<Checkbox
						checked={autoRenew}
						onCheckedChange={setAutoRenew}
						id="next-billing-date"
					/>
					<Label htmlFor="next-billing-date" className="px-1">
						Auto renew
					</Label>
				</div>
				<div className="flex flex-row gap-1 w-full md:w-auto flex-shrink-0">
					<Checkbox
						checked={businessDaysOnly}
						onCheckedChange={setBusinessDaysOnly}
						id="business-days-only"
					/>
					<Label htmlFor="business-days-only" className="px-1">
						Business days only
					</Label>
				</div>
			</div>
			<div className="flex flex-col w-full max-w-[25cm] mt-4 min-w-full">
				<Label htmlFor="notes" className="px-1">
					Notes
				</Label>
				<Textarea
					id="notes"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Notes"
					className={"min-w-full"}
				/>
			</div>
			<div className="mt-4">
				<Button
					variant="outline"
					className="cursor-pointer justify-between font-normal"
					onClick={submitChanges}
					disabled={loading}
				>
					{loading ? (
						<>
							<LoaderCircle size={32} className="animate-spin" />
							<p>Saving...</p>
						</>
					) : (
						"Submit Changes"
					)}
				</Button>
			</div>
		</>
	);
}
