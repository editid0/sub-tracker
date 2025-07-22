import moment from "moment/moment";
import { Separator } from "@/components/ui/separator"
import { Funnel_Sans } from "next/font/google";
import currencies from 'world-currencies';
import { currentUser } from '@clerk/nextjs/server'
import { Button } from "@/components/ui/button";

const funnel_sans = Funnel_Sans({
    variable: "--font-funnel-sans",
    subsets: ["latin"],
});

export default async function DashboardPage() {
    const user = await currentUser();
    const paymentNames = ['Netflix', 'Spotify', 'Amazon Prime', 'Disney+', 'Hulu', 'Apple Music', 'YouTube Premium', 'Dropbox'];
    const payments = Array.from({ length: 16 }).map((_, i) => ({
        id: i + 1,
        date: moment().add(Math.floor(Math.random() * 14) + 1, 'days'),
        amount: (Math.random() * 20 + 2).toFixed(2) * 1,
        name: paymentNames[Math.floor(Math.random() * paymentNames.length)]
    }));
    // Sort payments by date
    payments.sort((a, b) => a.date - b.date);
    // Group payments by week
    const groupedPayments = payments.reduce((acc, payment) => {
        const weekStart = payment.date.clone().startOf('week'); // Get the start of the week for the payment date
        const weekKey = weekStart.format('YYYY-MM-DD');
        if (!acc[weekKey]) {
            acc[weekKey] = [];
        }
        acc[weekKey].push(payment);
        return acc;
    }, {});
    function roundValue(value) {
        let rounded = Math.round(value * 100) / 100;
        return rounded.toFixed(2);
    };
    function codeToSymbol(code) {
        const currency = currencies[code];
        return currency ? currency.units.major.symbol : code;
    }
    function getSymbol() {
        if (!user) return "£"; // Default to GBP if no user
        const metadata = user.unsafeMetadata || {};
        const currencyCode = metadata.currency || "GBP"; // Default to GBP if no currency set
        const currency = currencies[currencyCode];
        return currency ? currency.units.major.symbol : "£";
    }
    return (
        <div className="w-full px-2 mt-4">
            <div className="mapbg max-w-[30cm] mx-auto w-full md:w-1/2 min-w-fit py-4 px-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl">
                <h1 className="text-4xl font-bold text-center">Dashboard</h1>
                <p className="text-center mt-2 text-2xl">View your overview here.</p>
            </div>
            <div className="mt-8 max-w-[30cm] flex flex-col sm:flex-row items-center justify-center gap-4 w-full md:w-1/2 mx-auto">
                <div className="mapbg w-full relative border-2 border-accent-foreground/40 bg-accent/30 shadow-xl rounded-2xl p-4">
                    <h2 className="text-xl font-semibold">This Week</h2>
                    <p className={"text-6xl " + funnel_sans.className}>{getSymbol()}{roundValue(groupedPayments[moment().startOf('week').format('YYYY-MM-DD')]?.reduce((acc, payment) => acc + payment.amount, 0) ?? 0)}</p>
                </div>
                <div className="mapbg w-full relative border-2 border-accent-foreground/40 bg-accent/30 shadow-xl rounded-2xl p-4">
                    <h2 className="text-xl font-semibold">Next Week</h2>
                    <p className={"text-6xl " + funnel_sans.className}>{getSymbol()}{roundValue(groupedPayments[moment().add(1, 'week').startOf('week').format('YYYY-MM-DD')]?.reduce((acc, payment) => acc + payment.amount, 0) ?? 0)}</p>
                </div>
            </div>
            <div className="mapbg max-w-[30cm] w-full md:w-1/2 mx-auto mt-8 p-4 rounded-2xl border-2 border-accent-foreground/40 bg-accent/30 shadow-xl">
                <h2 className="text-2xl font-semibold">Upcoming payments</h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {payments.map(payment => (
                        <div
                            key={payment.id}
                            className="flex relative flex-col items-start bg-accent/10 p-4 rounded-lg border-2 border-accent-foreground/40 shadow-md h-40 min-w-0 backdrop-blur-md"
                        >
                            <h3 className="text-lg font-semibold">{payment.name}</h3>
                            <span>{payment.date.format('dddd Do MMMM YYYY')}</span>
                            <span className={"text-4xl text-muted-foreground bottom-[1rem] absolute " + funnel_sans.className}>{getSymbol()}{payment.amount.toFixed(2)}</span>
                        </div>
                    ))}
                    <div
                        className="flex relative flex-col items-start bg-accent/10 p-4 rounded-lg border-2 border-accent-foreground/40 shadow-md h-40 min-w-0 backdrop-blur-md"
                    >
                        <h3 className="text-lg font-semibold">Add subscription</h3>
                        <Button className={"bottom-[1rem] absolute cursor-pointer"}>Add</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}