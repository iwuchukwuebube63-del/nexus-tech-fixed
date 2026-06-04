# Nexus Tech - Development TODO

## Visual Assets
- [x] Generate Nexus Tech logo (corporate white/blue/cyan)
- [x] Generate 6 device images (Entry Mobile, Mid-Range Mobile, Pro Tablet, Business Laptop, Power Workstation, Enterprise Server)
- [x] Logo placement: Top-left corner on all pages
- [x] Color scheme: White, Blue, Cyan, and Gold accents

## Database & Schema
- [x] Design database schema (users, investments, transactions, referrals, deposits, withdrawals)
- [x] Create Drizzle schema with all tables
- [x] Generate and apply database migrations

## Backend - Core Features
- [x] Implement user authentication (phone number sign-up, auto-login)
- [x] Implement ₦500 welcome bonus on first login
- [x] Implement investment/rental plan system with durations:
  - Plans 1-3: 15 days
  - Plans 4-6: 30 days
- [x] Implement deposit flow with receipt upload to S3
- [x] Implement withdrawal flow with bank account linking and 10% withdrawal fee
- [x] Implement referral system (5% direct, 2% second-level)
- [x] Implement daily commission cron job
- [x] Implement transaction history tracking
- [x] Set up admin notification system for deposits/withdrawals

## Frontend - Public Pages
- [x] Build landing page with logo, device showcase, and company story
- [x] Build phone number sign-up page with auto-login

## Frontend - Authenticated Pages
- [x] Build Dashboard page (balance, earnings, active plan, user ID, referral link, quick actions)
- [x] Build Invest page (6 rental tiers with device images, "Rent Now" buttons)
- [x] Build Deposit page (quick-select buttons, receipt upload, confirmation)
- [x] Build Withdraw page (bank account linking, pending status, approval flow)
- [x] Build Invite/Referral page (referral link, earnings history)
- [x] Build Wallet page (transaction history with all types)
- [x] Build "Our Goal" modal (company story)

## Frontend - Navigation & Layout
- [x] Implement fixed bottom navigation bar (Dashboard, Invest, Invite, Wallet)
- [x] Ensure bottom nav persists on all authenticated pages
- [x] Implement role-based routing (user vs admin)

## Admin Panel
- [x] Build admin dashboard layout
- [x] Implement user search by ID
- [x] Implement user dashboard viewer
- [x] Implement pending transaction management
- [x] Implement balance adjustment tool
- [x] Implement deposit approval/decline workflow
- [x] Implement withdrawal approval/decline workflow
- [x] Build admin FAQ/Help page
- [x] Add Contact Support button (Telegram username configurable)

## Testing & Polish
- [x] Verify all images render correctly (no corruption)
- [x] Test phone sign-up flow end-to-end
- [x] Test deposit flow with receipt upload
- [x] Test withdrawal flow with bank linking
- [x] Test investment/rental plan activation
- [x] Test referral system (5% and 2% calculations)
- [x] Test daily commission cron job
- [x] Test admin panel workflows
- [x] Verify bottom navigation on all pages
- [x] Ensure zero errors and professional polish
- [x] Test responsive design on mobile and desktop
- [x] Write comprehensive unit tests (22 tests passing)

## Deployment
- [x] Create final checkpoint
- [x] Publish to production

## Phase 2 Updates - Major Enhancements

### Investment Tiers (8 Total)
- [x] Add Level 7: ₦250,000 → ₦50,000/day (30 days)
- [x] Add Level 8: ₦500,000 → ₦100,000/day (30 days)
- [x] Fix landing page to display all 8 plans correctly

### Configuration System
- [x] Create config.json with all platform variables
- [x] Add environment variable loading for config
- [x] Include: bot token, customer service username, bank details, bonus amounts, fees, referral rates

### Loader Animations
- [x] Add Nexus Tech logo scaling animation (grow/shrink)
- [x] Apply loader to all loading states (deposits, withdrawals, investments)
- [x] Add loading overlay with animation

### Income Tab
- [x] Create new Income page showing:
  - [x] All rented products (active investments)
  - [x] Time remaining for each investment
  - [x] Income earned per product
  - [x] Total income display

### Customer Service Button
- [x] Create draggable circular button with headphones icon
- [x] Make button moveable around screen
- [x] Link to Telegram customer service

### Welcome Popup
- [x] Design popup modal matching provided example
- [x] Show on login, signup, and dashboard visit
- [x] Display: User ID, welcome bonus, min withdrawal, referral rates, customer service info
- [x] Add close button and Telegram link

### Economics Updates
- [x] Update minimum withdrawal to ₦2,000
- [x] Update referral bonuses: 15% first level, 5% second level
- [x] Update all calculations and validations

### OAuth & Button Fixes
- [ ] Fix OAuth sign-in issue after publishing
- [ ] Ensure all buttons and hyperlinks are functional
- [ ] Test all navigation flows

### Termux Testing Guide
- [ ] Provide step-by-step instructions for downloading and testing on Termux
