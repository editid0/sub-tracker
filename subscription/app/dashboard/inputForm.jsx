"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { useDebounce } from "@uidotdev/usehooks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import moment from "moment/moment";

export default function InputForm() {
    // fetch user data to get currency symbol
    const { user, isLoaded } = useUser();
    const [currencySymbol, setCurrencySymbol] = useState("£");

    // state variables for form inputs
    const [name, setName] = useState("");
    const [amount_, setAmount] = useState("");
    const amount = useDebounce(amount_, 500);
    const [date, setDate] = useState("");
    const [frequency, setFrequency] = useState("monthly");
    const [notes, setNotes] = useState("");
    const [category, setCategory] = useState("entertainment");
    const [paymentMethod, setPaymentMethod] = useState("Card 1");
    const [status, setStatus] = useState("active");
    const [autoRenew, setAutoRenew] = useState(true);
    const [finalDate, setFinalDate] = useState("");

    useEffect(() => {
        // using regex, remove all non-numeric characters from amount
        setAmount(prev => prev.replace(/[^0-9.]/g, ""));
    }, [amount]);

    useEffect(() => {
        if (!user || !isLoaded) return;
        const metadata = user.unsafeMetadata || {};
        const currency = metadata.currency || "GBP"; // default to £ if not set
        const currencies = {
            GBP: "£",
            USD: "$",
            EUR: "€"
        }
        setCurrencySymbol(currencies[currency] || "£");
    }, [isLoaded]);

    useEffect(() => {
        if (!amount) return;
        // format amount to 2 decimal places
        const formattedAmount = parseFloat(amount).toFixed(2);
        setAmount(formattedAmount);
    }, [amount]);

    return (
        <>
            <div className="grid w-full max-w-sm items-center gap-1">
                <Label htmlFor="name">Name</Label>
                <Input type="text" id="name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1">
                <Label htmlFor="amount">Amount</Label>
                <div className="flex flex-row items-center">
                    <p className="dark:bg-input/30 border-input h-9 rounded-l-md flex items-center border bg-transparent border-r-0 px-3 py-1 text-base shadow-xs transition-[color,box-shadow] opacity-50">{currencySymbol}</p>
                    <Input type="text" id="amount" placeholder="Amount" value={amount_} onChange={(e) => setAmount(e.target.value)} className={"rounded-l-none w-full"} />
                </div>
            </div>
            <div className="grid w-full max-w-sm items-center gap-1">
                <Label htmlFor="date">Next Billing Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            data-empty={!date}
                            className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
                        >
                            <CalendarIcon />
                            {date ? moment(date).format("MMM D, YYYY") : <span>Next billing date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={setDate} disabled={date => date <= new Date()} />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="grid w-full max-w-sm items-center gap-1">
                <Label htmlFor="frequency">Frequency</Label>
                <Input type="text" id="frequency" placeholder="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
            </div>
        </>
    )
}