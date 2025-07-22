import { Button } from "@/components/ui/button";
import { Space_Mono } from "next/font/google";
import Image from "next/image";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"

const space = Space_Mono({
	variable: "--font-space-mono",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export default async function HomePage(context) {
	const { searchParams } = context;
	const som = (await searchParams).som || "false";
	return (
		<>
			<Dialog defaultOpen={som === "true"}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Notes for testers and voters</DialogTitle>
						<DialogDescription>
							Hello, if you are testing this site or voting on it,
							please press the sign in button and pick a random username
							and password, the auth provider I am using doesn't have demo
							accounts.
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
			<div className="mapbg mx-auto mt-10 flex min-h-[10cm] md:min-h-[15cm] w-4/5 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl">
				<h1 className={"text-2xl md:text-8xl text-center font-semibold " + space.className}>Subscription Tracker</h1>
				<p className={"md:text-3xl text-center " + space.className}>Track your subscriptions with ease, for free.</p>
				<Button className="mt-4 cursor-pointer" size="lg">
					Get Started
				</Button>
			</div>
			<div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-10 max-w-4/5 mx-auto">
				<div className="mapbg mx-auto mt-10 flex w-4/5 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl p-4">
					<Image src={"https://picsum.photos/seed/1/600/400"} width={"600"} height={"400"} alt="Placeholder text" className="rounded-lg w-full" />
					<h2 className="text-2xl font-semibold">Demo one</h2>
					<p>Description of features here</p>
				</div>
				<div className="mapbg mx-auto mt-10 flex w-4/5 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl p-4">
					<Image src={"https://picsum.photos/seed/2/600/400"} width={"600"} height={"400"} alt="Placeholder text" className="rounded-lg w-full" />
					<h2 className="text-2xl font-semibold">Demo two</h2>
					<p>Description of features here</p>
				</div>
			</div>
		</>
	);
}