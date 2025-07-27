"use client";

import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { useDebounce } from "@uidotdev/usehooks";
import moment from "moment-timezone";
import { useEffect, useState } from "react";

export default function EditableFields({ subscription }) {
    const { user, isLoaded } = useUser();
    const [currencySymbol, setCurrencySymbol] = useState("£");

    // all the fields
    const [name, setName] = useState(subscription.name || "");
    const [startDate, setStartDate] = useState(moment(subscription.start_date) || "");
    const [amount_, setAmount] = useState(subscription.amount || "");
    const amount = useDebounce(amount_, 500);
    const [frequency, setFrequency] = useState(subscription.frequency || "monthly");
    const [frequencyCount, setFrequencyCount] = useState(1);
    const [frequencyUnit, setFrequencyUnit] = useState("month");
    const [nextBillingDate, setNextBillingDate] = useState(moment());
    const [businessDaysOnly, setBusinessDaysOnly] = useState(subscription.business_days_only || false);
    const [notes, setNotes] = useState(subscription.notes || "");
    const [category, setCategory] = useState(subscription.category || "Other");
    const [paymentMethod, setPaymentMethod] = useState(subscription.payment_method || "Credit Card");
    const [status, setStatus] = useState(subscription.status || "active");
    const [autoRenew, setAutoRenew] = useState(subscription.auto_renew || true);
    const [finalDate, setFinalDate] = useState(subscription.final_date || null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (isLoaded && user) {
            const userCurrency = user.unsafeMetadata.currency || "£";
            setCurrencySymbol(userCurrency);
        }
    }, [isLoaded, user])

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
            setNextBillingDate(moment(startDate).add(frequencyCount, frequencyUnit));
        } else {
            let nextDate = moment(startDate).add(frequencyCount, frequencyUnit);
            while (nextDate.isoWeekday() > 5) { // Skip weekends
                nextDate.add(1, 'day');
            }
            setNextBillingDate(nextDate);
        }
    }, [frequency, startDate])

    return (
        <>
            <div>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Subscription Name" />
            </div>
        </>
    )
}
