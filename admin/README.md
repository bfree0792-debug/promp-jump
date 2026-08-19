# PromptJump Admin Panel

A multi-page React admin dashboard for PromptJump, built with React Router, Tailwind CSS, and lucide-react icons. Matches the provided design exactly, with mock data wired in so it's ready to swap for real API calls.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:4000

## Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Project structure

```
src/
  layouts/
    AdminLayout.jsx      # Sidebar + topbar shell, mobile drawer
  components/
    Sidebar.jsx           # Desktop sidebar nav
    Topbar.jsx             # Search, notifications, admin menu
    TierCard.jsx           # Free / Pro / Team hero cards
    StatCard.jsx           # Metric cards (Total Prompts, Image Prompts, etc.)
    FilterBar.jsx          # Search + category/type/status/access filters
    PromptTable.jsx        # Prompt data table with row actions dropdown
  pages/
    Dashboard.jsx          # Landing page (tier cards, stats, recent prompts)
    PromptManagement.jsx   # Full prompt table with filters
    PlaceholderPage.jsx    # Reusable "coming soon" page for other sections
  data/
    mockData.js            # Mock prompts, stats, admin profile
    navConfig.js            # Sidebar navigation items + routes
  App.jsx                  # Route definitions
```

## Pages wired up

- **Dashboard** (`/`) — fully built, matches the design screenshot
- **Prompt Management** (`/prompts`) — fully built, matches the design screenshot
- All other sidebar items (Users, Trending Prompts, Categories, Subscription Plans,
  Coupons, Analytics, Revenue, Reviews, Announcements, Blog, Settings, Admin Profile)
  route to a placeholder page ready for you to fill in with real content.

## Connecting to your backend

All data currently comes from `src/data/mockData.js`. Replace the static imports in
each page with your API calls (e.g. `fetch`, `axios`, React Query) — the components
already expect the same shape as the mock data, so swapping the source is the only
change needed.
