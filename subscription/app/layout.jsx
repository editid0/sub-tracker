import { Geist, Geist_Mono, Space_Mono } from "next/font/google";
import "./globals.css";
import { ClerkLoaded, ClerkLoading, ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { dark } from '@clerk/themes'
import Link from "next/link";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata = {
	title: "Subscription Tracker",
	description: "Track your subscriptions effortlessly",
};

export default function RootLayout({ children }) {
	return (
		<ClerkProvider appearance={{
			baseTheme: dark,
		}}>
			<html lang="en" suppressHydrationWarning>
				<body
					className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				>
					<ThemeProvider storageKey="theme" defaultTheme="system" enableSystem={true} attribute={"class"}>
						<div className="w-full max-w-[15cm] mx-auto rounded-b-xl border-2 border-t-0 border-accent sticky top-0 z-50">
							<div className="relative py-2 px-4 overflow-hidden bg-accent/80 backdrop-blur-md rounded-b-lg">
								<div className="bg-noise absolute w-full h-full rounded-b-xl m-0 p-0 left-0 top-0">
								</div>
								<div className="flex flex-row items-center justify-between">
									<div className="relative z-10 flex flex-row justify-start gap-4">
										<Link href={"/"} className="hover:underline font-semibold text-lg text-accent-foreground">
											Home
										</Link>
										<Link href={"/dashboard"} className="hover:underline font-semibold text-lg text-accent-foreground">
											Dashboard
										</Link>
									</div>
									<div className="relative z-10 flex flex-row-reverse justify-end gap-2">
										<ClerkLoaded>
											<SignedIn>
												<UserButton userProfileMode="modal" />
											</SignedIn>
											<SignedOut>
												<Button asChild variant="outline" size="sm" className={"cursor-pointer"}>
													<SignInButton />
												</Button>
											</SignedOut>
										</ClerkLoaded>
										<ClerkLoading>
											<Button variant="outline" size="sm" className={"cursor-not-allowed"}>
												<LoaderCircle className="animate-spin" />
											</Button>
										</ClerkLoading>
									</div>
								</div>
							</div>
						</div>
						{children}
					</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
