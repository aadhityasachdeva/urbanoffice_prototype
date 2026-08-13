# Urban Office Space

 a clean, professional, responsive web application called "UrbanOffice" — a smart workspace booking and management platform. Keep the code as SIMPLE and READABLE as possible. This is for a student demo, not a production system, so prioritize clarity over cleverness.

TECH STACK

- React with TypeScript

- Supabase for authentication and database (use Supabase Auth email/password, and a Postgres database via Supabase)

- Tailwind CSS for styling

- No other libraries or state management tools 

- No custom backend server  using Supabase directly from the frontend

DATABASE TABLES 

1. profiles

   - id (uuid, references auth.users, primary key)

   - full_name (text)

   - email (text)

   - role (text, either 'user' or 'admin', default 'user')

2. workspaces

   - id (uuid, primary key, default gen_random_uuid())

   - name (text) — e.g. "Pera Co-working Desk"

   - category (text) — one of 'Desk Space', 'Meeting Room', 'Event Space'

   - location (text) — e.g. "Pudong, Shanghai"

   - capacity (integer)

   - price_per_hour (numeric)

   - amenities (text) — comma separated, e.g. "Wi-Fi, Coffee, Charging Station"

   - image_url (text)

   - description (text)

3. bookings

   - id (uuid, primary key, default gen_random_uuid())

   - workspace_id (uuid, references workspaces)

   - user_id (uuid, references profiles)

   - booking_date (date)

   - start_time (time)

   - end_time (time)

   - status (text, either 'confirmed' or 'cancelled', default 'confirmed')

   - created_at (timestamp, default now())

SAMPLE DATA (seed the database with this so the demo isn't empty)

 at least 8 workspaces spread across all three categories, using venue-style names such as: "Pera Desk Hub", "Kebabs on the Grille - Co-work Corner", "1001 Nights Meeting Room", "El Bodegon Private Room", "UP Shanghai Event Hall", "Cotton's Desk Space", "Pot Stills Meeting Room", "The Beach House Event Space" — with realistic Shanghai locations, capacities, hourly prices, and amenities like Wi-Fi, coffee, tea, charging stations, projector (for meeting/event spaces).

 3 sample user accounts (one should be role='admin') and a handful of sample bookings across different dates so "My Bookings" and the admin dashboard aren't empty.

PAGES / SCREENS

1. Login / Signup page

   - Simple email + password form using Supabase Auth

   - New users default to role='user'

2. Dashboard (after login)

   - Welcome message

   - Quick links to the 3 categories

   - A short list of the user's upcoming bookings

3. Browse Workspaces

   - Tabs or filter buttons for the 3 categories: Desk Space, Meeting Room, Event Space

   - Grid of workspace cards showing name, location, price, capacity, amenities

   - Clicking a card opens the workspace detail page

4. Workspace Detail + Booking

   - Show full workspace info

   - Date picker and start/end time picker

   - Before allowing the user to confirm, check the bookings table for any EXISTING confirmed booking on the SAME workspace, SAME date, where the time ranges overlap (start_time < new_end_time AND end_time > new_start_time). If an overlap is found, show a clear error message and DO NOT create the booking. If no overlap, insert the new booking with status='confirmed' and show a success confirmation.

   - This overlap check must be real logic against the database, not a fake success message.

5. My Bookings

   - List of the logged-in user's bookings (upcoming and past), pulled from the bookings table filtered by user_id

   - Each upcoming booking has a "Cancel" button that updates status to 'cancelled' (do not delete the row — keep it for history)

6. Admin Dashboard (only visible if profiles.role = 'admin')

   - Tab 1: Manage Workspaces — table of all workspaces with add/edit/delete

   - Tab 2: All Bookings — table of every booking across all users, with workspace name, user name, date, time, status

   - Tab 3: Users — simple table listing all profiles and their role

SECURITY

 Supabase Row Level Security (RLS):

- Users can only view and cancel their own bookings

- Users can view all workspaces (read-only) but cannot edit them

- Only users with role='admin' can insert/update/delete workspaces, or view all bookings/users




```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
