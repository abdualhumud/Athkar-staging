# CLAUDE.md — Lamhub Food Delivery App

## Project Overview

**Lamhub** — "Where Groups Order Smarter" — a mobile-first group food delivery SPA for Riyadh, Saudi Arabia. Users order from multiple restaurants in the same hub area with one shared delivery fee.

- **Live URL:** https://abdualhumud.github.io/Abdulrahman-/
- **Repository:** https://github.com/abdualhumud/Abdulrahman-
- **Branch:** `master` (deployed via GitHub Pages from root)
- **Push command:** `git -c http.sslVerify=false push origin master` (SSL issues on network)

---

## Architecture

Pure static SPA — no framework, no build tools, no backend.

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | ~370 | All screen markup, CDN links (Leaflet, Google Fonts) |
| `app.js` | ~2150 | All logic: state, rendering, navigation, data |
| `styles.css` | ~3970 | Complete design system, responsive, RTL support |

### Key Design Constraints
- **Phone frame:** 393×852px with `border-radius: 40px`
- **Bilingual:** Arabic (RTL) + English (LTR) via `data-en`/`data-ar` attributes
- **No dependencies** except Google Fonts (Inter + Tajawal) and Leaflet.js for maps
- **Images:** Unsplash CDN (`images.unsplash.com/photo-xxx?w=400&h=300&fit=crop`)

---

## Screen Navigation

All screens are `<div class="screen">` elements toggled via `showScreen(screenId)`:

| Screen ID | Purpose | Render Function |
|-----------|---------|-----------------|
| `screen-welcome` | Onboarding (3 slides) + language selector | — |
| `screen-signup` | Registration form + Google sign-in | — |
| `screen-login` | Email/password + Google sign-in | — |
| `screen-otp` | 4-digit OTP verification | `setupOTPInputs()` |
| `screen-home` | Hub cards, area tabs, nearby restaurants | `renderHome()` |
| `screen-group` | Group order management, invite | `renderGroup()` |
| `screen-restaurants` | Browse/filter restaurants by area | `renderRestaurants()` |
| `screen-menu` | Restaurant menu with categories | `renderMenu()` |
| `screen-cart` | Cart with grouped items, delivery fee | `renderCart()` |
| `screen-checkout` | Address, payment, place order | `renderCheckout()` |
| `screen-profile` | User info, menu links | `renderProfile()` |
| `screen-orders` | Order history list | `renderOrders()` |
| `screen-addresses` | Saved delivery addresses | `renderAddresses()` |
| `screen-payments` | Payment methods | `renderPayments()` |
| `screen-notifications` | Notification feed | `renderNotifications()` |
| `screen-tracking` | Order tracking timeline + map | `renderTracking()` |

Auth screens hide bottom nav. `showScreen()` auto-calls the render function.

---

## Data Model

### Global State Variables
```
currentLang        'en' | 'ar'
currentUser        { id, name, email, phone, password, avatar, joinDate, authProvider }
cart               [{ itemId, restaurantId, restaurantName, area, nameEn, nameAr, price, quantity, image }]
cartArea           'hittin' | 'olaya' | ... | null (enforces single-area cart)
activeArea         Current area tab selection on home
showAllStores      Boolean toggle for Explore screen
selectedPayment    'card' | 'apple' | 'cash'
deliveryAddress    { label, address, lat, lng }
savedAddresses     Array of user-added addresses
groupOrder         { id, host, hostAvatar, members[], area, createdAt }
window.orderHistory  Array of past orders with status progression
leafletMap         Leaflet map instance (cleaned up on modal close)
```

### localStorage Keys
| Key | Content |
|-----|---------|
| `lamhub_user` | User profile JSON |
| `lamhub_cart` | Cart items array |
| `lamhub_group` | Active group order |
| `lamhub_addresses` | User-saved addresses |
| `lamhub_delivery_address` | Current delivery address |
| `lamhub_orders` | Order history array |

### Restaurant Data (`RESTAURANTS` array)
25 restaurants across 5 areas (5 per area):
- **Hittin:** Section-B, Smokey Beards, Feels, L'aroma, Mama Noura
- **Olaya:** Wood's, Swiss Butter, Leila, Sultan Delight, Shawarma House
- **Malqa:** Nobu, The Butcher Shop, Brew92, Bafarat, Kudu
- **Nakheel:** Nando's, PizzaExpress, Five Guys, Paul, Caribou
- **KAFD:** Tatami, La Brasserie, Hashi, Din Tai Fung, %Arabica

Each restaurant has: `id, name, area, cuisineEn, cuisineAr, rating, deliveryTime, priceRange, image, cover, menu[]`

Each menu category has: `cat, catAr, items[]`
Each item has: `id, nameEn, nameAr, descEn, descAr, price, image`

---

## Key Business Logic

### Area Restriction
- Cart is locked to ONE area at a time (`cartArea`)
- `showAreaConflictModal()` warns when adding items from a different area
- Shows similar restaurants in current area as alternatives
- "Switch" clears cart and changes area; "Stay" keeps current cart
- Applied at both `addItemFromDetail()` and `openRestaurantSmart()` (Explore screen)

### Delivery Fee & Savings
- Standard fee: **15 SAR** (single fee regardless of restaurant count)
- Savings shown only when 2+ restaurants in cart
- Explainer text: "Ordering from X restaurants separately would cost SAR Y delivery"

### Order Flow
1. Browse → Add to cart → Cart review → Checkout → Place Order
2. `placeOrder()` saves to `window.orderHistory` with metadata
3. Status auto-progresses: `preparing` → `onway` (15s) → `delivered` (30s)
4. After confirmation overlay, user goes to tracking screen (not home)

---

## Features Implemented

### Interactive Map (Leaflet.js)
- OpenStreetMap tiles, centered on Riyadh (24.7136, 46.6753)
- Draggable pin marker updates `deliveryAddress` coordinates
- 5 colored polygon boundaries for hub areas with permanent labels
- Tracking screen has a second map with user + driver markers
- Map instance cleaned up on modal close to prevent memory leaks

### Language System
- Welcome screen: `English` / `العربية` selector buttons
- In-app: `toggleLanguage()` via header button
- All static text uses `data-en`/`data-ar` attributes
- All dynamic text uses `currentLang === 'en' ? ... : ...` ternaries
- Placeholders use `data-placeholder-en`/`data-placeholder-ar`
- RTL: `[dir="rtl"]` CSS selectors throughout

### Authentication
- **Email/password:** `signup()` → OTP → `verifyOTP()` → home
- **Google OAuth simulation:** `googleSignIn()` → account picker popup → `completeGoogleSignIn()`
- Users saved to localStorage with `authProvider` field
- OTP accepts any 4 digits (demo mode)

### Desktop Navigation
- `ArrowUp/Down`: scroll 100px
- `PageUp/Down`: scroll 80% of viewport
- `Home/End`: scroll to top/bottom (skipped in input fields)
- `Escape`: closes modals (item detail → location map → order confirmation)

### Payment System
- JS-controlled selection via `selectPayment(method)` (no radio buttons)
- Three options: Credit/Debit Card, Apple Pay, Cash on Delivery
- "Add New Card" expandable form with formatting helpers
- SVG icons for all payment methods

---

## CSS Architecture

### Design Tokens (CSS Variables)
```css
--primary: #FF6B35    --primary-light: #FFF0E8    --primary-dark: #E55A2B
--green: #059669      --green-light: #D1FAE5
--purple: #7C3AED     --bg: #FAFAFA
```

### Key Patterns
- `.screen` + `.active` for navigation
- `.screen-scroll` for scrollable content areas (smooth scroll enabled)
- Overlays: `.area-conflict-overlay`, `.location-map-overlay`, `.google-auth-overlay`, `.confirmation-overlay`
- All overlays use `opacity` transition with `.show` class
- Cards: `border-radius: 16px`, `box-shadow: 0 2px 8px rgba(0,0,0,0.06)`

### RTL Support
Every new component has `[dir="rtl"]` overrides:
- `flex-direction: row-reverse` for horizontal layouts
- `text-align: right` for text containers
- `left`/`right` swaps for positioned elements
- `border-left`/`border-right` swaps for notification cards

---

## Related Repository

**Athkar** (separate project): https://github.com/abdualhumud/Athkar
- Daily Wird & Athkar website (Arabic supplications)
- Files: `index.html`, `athkar.html`, `wird.html`, `CLAUDE.md`
- **Must not be mixed** with this food delivery repo

---

## Common Pitfalls

1. **SSL on push:** Always use `git -c http.sslVerify=false push origin master`
2. **Leaflet cleanup:** Must call `leafletMap.remove()` before removing modal DOM, or map instance leaks
3. **Cart area sync:** When cart empties, `cartArea` must reset to `null`
4. **Language toggle:** Dynamic content must re-render after toggle — check `toggleLanguage()` calls all render functions
5. **index.html must be the food delivery page**, not the Athkar page (was overwritten once in commit `d9991cd`)
6. **Price updates:** Use `replace_all: false` with exact `price:` matches — many items share similar structures
7. **No radio buttons for payment:** Previous implementation caused Apple Pay double-selection bug. Use div-based selection with JS `.active` class only
