"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import currencies from "world-currencies";
import { useTheme } from "next-themes";

export default function SettingsPage() {
	const { user, isLoaded } = useUser();
	const [currency, setCurrency] = useState("GBP");
	const { theme, setTheme, resolvedTheme } = useTheme();

	useEffect(() => {
		if (!isLoaded) return;
		const metadata = user.unsafeMetadata || {};
		setCurrency(metadata.currency || "GBP");
	}, [isLoaded]);

	useEffect(() => {
		if (isLoaded) {
			user.update({
				unsafeMetadata: {
					...user.unsafeMetadata,
					currency: currency,
				},
			});
		}
	}, [currency, isLoaded, user]);

	const currencies = {
		USD: { name: "US Dollar", symbol: "$" },
		EUR: { name: "Euro", symbol: "€" },
		GBP: { name: "British Pound", symbol: "£" },
	};

	const themeOptions = {
		system: { name: "System" },
		light: { name: "Light" },
		dark: { name: "Dark" },
	};

	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center">Loading...</div>
		);
	}

	return (
		<div className="w-full px-2 mt-4">
			<div className="mapbg max-w-[30cm] mx-auto w-full md:w-1/2 min-w-fit py-4 px-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl">
				<h1 className="text-4xl font-bold text-center">Settings</h1>
				<p className="text-center mt-2 text-2xl">
					Update your preferences
				</p>
			</div>
			<div className="mapbg mt-8 max-w-[30cm] mx-auto w-full md:w-1/2 min-w-fit py-4 px-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl">
				<h2 className="text-2xl font-semibold mb-4">Preferences</h2>
				<div className="flex flex-col md:flex-row gap-4 flex-wrap">
					<div className="mb-4">
						<label className="block text-sm font-medium mb-2">
							Currency
						</label>
						<Select value={currency} onValueChange={setCurrency}>
							<SelectTrigger>
								<SelectValue placeholder="Select currency" />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(currencies).map(
									([code, { name, symbol }]) => (
										<SelectItem key={code} value={code}>
											{name} ({symbol})
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
					</div>
					<div className="mb-4">
						<label className="block text-sm font-medium mb-2">
							Theme
						</label>
						<Select value={theme} onValueChange={setTheme}>
							<SelectTrigger>
								<SelectValue placeholder="Select theme" />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(themeOptions).map(
									([code, { name }]) => (
										<SelectItem key={code} value={code}>
											{name}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
		</div>
	);
}
