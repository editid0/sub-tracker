# sub-tracker
An open source subscription tracker, with various features including:
- Different billing cycles for different subcriptions
- Pausable subscriptions
- Final dates for subscriptions
- View total cost of subscriptions this week
- Choose your own currency in settings (£/$/€)
- Theme selector in settings (Light/Dark/System)
- Completely free

# Testing
1. `bun run build`
2. `bun run start`

# How to use
If you want to self host, you can use the above commands, with the following contents in a .env file in the `subscription` folder:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
DB_USER=<Username for DB>
DB_HOST=<IP address for DB>
DB_NAME=<DB name>
DB_PASS=<Password for DB>
DB_PORT=5432
```
If you want to use a hosted version, you can access that at https://sub.editid.uk

Once you are able to get onto the homepage, sign in using the navbar at the top, and then go to the dashboard. Once you're on the dashboard, you can simply add a subscription, fill in the required fields, save it, then refresh the page to see the new subscription.
