# Design Document: Yatori Study Control Console

| Attribute | Specification |
| :--- | :--- |
| **Document** | Yatori Study Control Console UI/UX Design Contract |
| **Author** | Yatori Frontend Engineering Team |
| **Status** | Approved / Living Design Document |
| **Last Updated** | 2026-09-11 |
| **Target Audience** | Frontend Engineers, UI/UX Designers, Agentic Collaborators |

---

## 1. Overview & Context

Yatori Study Control is a dedicated operational management console for Xuexitong (ChaoXing) course task execution and automated sign-in monitoring.

Yatori is engineered strictly as an operations console rather than a promotional or marketing page. The interface optimizes for high information density, low operational friction, and immediate cognitive clarity. Every screen and viewport must immediately answer four fundamental user questions:
1. **Which courses are currently actionable?**
2. **What is the active execution configuration?**
3. **What is the real-time operational status of running tasks?**
4. **What is the immediate next step or remediation action?**

---

## 2. Goals and Non-Goals

### 2.1 Goals
- **Deterministic Tokenization**: Guarantee 100% adherence to centralized design tokens defined in `src/index.css`.
- **State Transparency & Multi-Modal Feedback**: Express all lifecycle and task outcomes unambiguously through multi-modal feedback (text label, icon indicator, structural change) rather than color alone.
- **Strict WCAG 2.1 AA Compliance**: Enforce comprehensive accessibility standards across keyboard navigation, focus management, color contrast, and screen reader announcements.
- **Ergonomic Responsive Architecture**: Deliver tailored layouts for desktop workstations (full-height application shell) and mobile devices (thumb-zone optimized, safe-area aware).
- **Data Freshness and Fencing**: Guard against out-of-order asynchronous responses, state tearing, and memory leaks using timestamp fencing (`updatedAt`) and unmount cleanups.

### 2.2 Non-Goals
- **Marketing / Promotional Surfaces**: No decorative hero banners, vanity statistics, sales copy, or promotional carousels.
- **Ad-Hoc / Fragmented Styling**: Zero tolerance for raw hex codes, arbitrary font families, custom radii, or unvetted box shadows.
- **Inline Static Manuals**: Operational views must not be polluted with verbose tutorial guides; workflows should be intuitive and self-documenting.
- **Nested Scrolling Chaos**: Arbitrary nested scroll containers are forbidden; the root viewport handles page scrolling, with internal scroll restricted exclusively to unbounded terminal logs.

---

## 3. Detailed Design

### 3.1 Visual System & Design Tokens

The visual foundation adheres strictly to Google Material Design 3 (M3) tokenized design principles. All colors, typography, border radii, shadows, and transitions must originate from `src/index.css`. Feature components must never declare raw hexadecimal colors, ad-hoc utilities, or unmapped CSS values.

#### 3.1.1 Google Brand Identity Palette
The four-color Google brand palette is reserved exclusively for the brand layer (wordmark, application logos, and signature decorative accents such as `BrandMark` and `google-accent-bar`). It is strictly decoupled from transactional UI states.

| Token | Hex Value | Token Role & Usage Scope |
| :--- | :--- | :--- |
| `--google-blue` | `#4285F4` | Primary brand accent; wordmark letters `Y` & `o`; accent bar segment 1 |
| `--google-red` | `#EA4335` | Secondary brand accent; wordmark letters `a` & `i`; accent bar segment 2 |
| `--google-yellow` | `#FBBC05` | Tertiary brand accent; wordmark letter `t`; accent bar segment 3 |
| `--google-green` | `#34A853` | Quaternary brand accent; wordmark letter `r`; accent bar segment 4 |

> [!IMPORTANT]
> **Decoupling Rule**: UI controls and operational alerts must never directly reference `--google-*` tokens. For example, never use `--google-red` as a button error state; use semantic `--destructive` or `--danger` instead.

#### 3.1.2 Material Design 3 Semantic Color Tokens
Semantic tokens separate UI intent from concrete color values, guaranteeing automatic adaptation across Light and Dark themes while preserving WCAG AA contrast ratios.

| Semantic Token | Light Mode Hex | Dark Mode Hex | Intent & UI Role |
| :--- | :--- | :--- | :--- |
| **`--primary`** | `#0061a4` | `#9ecaef` | High-emphasis primary actions, prominent call-to-actions, active links |
| **`--primary-foreground`** | `#ffffff` | `#003258` | Text and icons rendered over `--primary` background |
| **`--primary-hover`** | `#0058bd` | `#9ecaef` | Hover state for primary interactive elements |
| **`--primary-container`** | `#d1e4ff` | `#00497d` | Low-to-medium emphasis container fill for selected or active tabs |
| **`--secondary`** | `#535f70` | `#bbc7db` | Medium-emphasis secondary actions, contextual toggles, badges |
| **`--secondary-foreground`** | `#ffffff` | `#253140` | Text and icons rendered over `--secondary` background |
| **`--background`** | `#fdfcff` | `#1a1c1e` | Application-level canvas background |
| **`--foreground`** | `#1a1c1e` | `#e2e2e6` | High-emphasis body text and primary glyphs |
| **`--card`** | `#fdfcff` | `#1e2022` | Surface container for course cards, task panels, and sections |
| **`--card-foreground`** | `#1a1c1e` | `#e2e2e6` | Text and icons rendered inside `--card` containers |
| **`--popover`** | `#fdfcff` | `#1a1c1e` | Surface container for tooltips, select menus, and dropdowns |
| **`--popover-foreground`** | `#1a1c1e` | `#e2e2e6` | Text and icons rendered inside `--popover` overlays |
| **`--muted`** | `#e0e2ec` | `#43474e` | Low-contrast backgrounds, disabled item fills, divider backings |
| **`--muted-foreground`** | `#43474e` | `#c3c7cf` | Medium-emphasis secondary text, timestamps, captions, helper text |
| **`--accent`** | `#d1e4ff` | `#00497d` | Interactive hover highlight backgrounds on lists and table rows |
| **`--accent-foreground`** | `#001d36` | `#d1e4ff` | Text and iconography rendered over `--accent` backgrounds |
| **`--border`** | `#c3c7cf` | `#43474e` | Structural borders, card boundaries, table separators |
| **`--input`** | `#73777f` | `#8d9199` | Default input border, unselected checkbox/radio outline |
| **`--ring`** | `#0061a4` | `#9ecaef` | Focus indicator outline for keyboard focus (`:focus-visible`) |

#### 3.1.3 Feedback & Operational Status Tokens
Operational states communicate task and system health. Pair each state token with its container token for badges, chips, and toast banners.

| Status Token | Light Mode Hex | Dark Mode Hex | Container Token | Container (Light/Dark) | Operational Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`--success`** | `#15803d` | `#86efac` | `--success-container` | `#dcfce7` / `#14532d` | Task completed successfully; verified sign-in; normal status |
| **`--warning`** | `#b45309` | `#fcd34d` | `--warning-container` | `#fef3c7` / `#78350f` | Daily limit reached (`waiting_daily_limit`); caution notice |
| **`--danger`** | `#b42318` | `#fda4af` | `--danger-container` | `#fee4e2` / `#4c0519` | Task failed; stopping error; network/execution exception |
| **`--destructive`** | `#ba1a1a` | `#ffb4ab` | `--danger-container` | `#fee4e2` / `#4c0519` | Irreversible delete actions, kill task triggers |
| **`--info`** | `#0061a4` | `#9ecaef` | `--info-container` | `#d1e4ff` / `#00497d` | Running progress indicators; informative operational notices |

#### 3.1.4 Domain-Specific Sign-In Category Tokens
Category tokens designate the *mode* of sign-in, while status tokens communicate the *outcome*. Category colors must never substitute for result status colors.

| Sign-In Category Token | Light Mode Hex | Dark Mode Hex | Container (Light/Dark) | Mechanism Represented |
| :--- | :--- | :--- | :--- | :--- |
| **`--sign-photo`** | `#4338ca` | `#c7d2fe` | `#e0e7ff` / `#312e81` | Photo verification sign-in |
| **`--sign-location`** | `#0e7490` | `#67e8f9` | `#cffafe` / `#164e63` | Geofence / GPS location sign-in |
| **`--sign-code`** | `#be185d` | `#f9a8d4` | `#fce7f3` / `#831843` | QR Code / Numeric pin sign-in |

#### 3.1.5 Typography, Elevation & Motion Tokens
- **Typography Stack**:
  - Primary font: `Plus Jakarta Sans`, fallback to system UI fonts (`sans-serif`) for CJK characters.
  - Body copy: `14px` font size with a `22px` line height (`14px/22px`).
  - Minimum text size: No visible text element may render smaller than `12px`.
- **4-Tier Elevation Shadows**:
  - `--shadow-rest`: Flat/resting card elevation (`0 1px 2px rgb(...)`).
  - `--shadow-raised`: Hovered card, interactive toggle raised elevation.
  - `--shadow-floating`: Bottom docked action bar, dropdown flyouts.
  - `--shadow-overlay`: Modal dialogs, slide-over drawer backdrop overlays.
- **M3 Motion Easing**:
  - Standard curve: `--ease-standard: cubic-bezier(0.2, 0, 0, 1)` for micro-interactions (`150ms – 250ms`).
  - Emphasized curve: `--ease-emphasized: cubic-bezier(0.22, 1, 0.36, 1)` for entrance/exit transitions (`220ms – 300ms`).
- **Interactive State Coverage**:
  - Every interactive component must define explicit styles across all standard states: **Default**, **Hover**, **Active**, **Loading**, **Success**, **Failure**, **Disabled**, and **Keyboard Focus (`:focus-visible`)**.

### 3.2 Layout & Viewport Specifications

- **Responsive Breakpoints & Margins**:
  - **Mobile (< 768px)**: `16px` outer horizontal margin.
  - **Tablet (768px – 1023px)**: `24px` outer horizontal margin.
  - **Desktop (≥ 1024px)**: `32px` outer horizontal margin.
  - **Section Spacing**: `24px` vertical spacing between major structural sections.
- **Desktop Layout (App Shell Architecture)**:
  - Full-height application shell (`100vh`, `overflow-hidden`).
  - Fixed left sidebar navigation (~`240px` width).
  - Fixed top bar displaying current view title, context breadcrumbs, and global action controls.
  - Contextual Task Details: Rendered in a slide-over right drawer (`Sheet`) on demand, keeping the primary course matrix visible and operable.
- **Mobile Layout (Touch-Optimized Architecture)**:
  - Bottom navigation bar for primary workspace navigation.
  - Floating action bar: Automatically docks directly above the bottom navigation bar when one or more courses are selected.
  - Document-level scrolling: The root viewport retains primary vertical scrolling. Nested internal scrollbars are strictly restricted to terminal log streams.
  - Viewport Ergonomics: Fixed mobile components must account for device safe areas (`env(safe-area-inset-*)`), virtual keyboard emergence, and backdrop scroll locking.
- **Authentication & Login Workflow**:
  - Strict two-step authentication sequence.
  - Input field ergonomics: Minimum input height of `48px` to facilitate error-free mobile data entry.
  - Inline error feedback: Errors must render immediately adjacent to the relevant input and be announced via `aria-live="polite"` or `role="alert"`.

### 3.3 Components & Accessibility (A11y)

- **Interactive Controls & Buttons**:
  - Primary actions must feature explicit text labels. Icon-only buttons must declare an accessible name via `aria-label` or visually hidden text.
  - Native semantic `<button>` elements or Radix accessible primitives must be used; clickable `<span>` or `<div>` elements are strictly forbidden.
  - Buttons must never be nested inside `<label>` elements.
  - Focus Rings: All focusable elements must retain visible, high-contrast `:focus-visible` outlines (`ring-2 ring-ring`). Never strip focus indicators with bare `outline-none`.
- **Form Controls & Inputs**:
  - Every form input must have a dedicated, visible `<label>`; `placeholder` attributes must never be used as a replacement for labels.
- **Multi-Modal Status Indicators & Contrast**:
  - Never convey status or system feedback using color alone. Pair color tokens with text labels, distinct iconography, or structural indicators.
  - Contrast ratios must strictly fulfill WCAG 2.1 AA benchmarks (minimum 4.5:1 for standard text, 3:1 for large text and interactive boundaries).
  - Meaningful images must provide descriptive `alt` text; purely decorative images must supply an empty `alt=""` attribute.
- **Dialogs & Overlays**:
  - Mobile dialog width: Constrained to viewport width minus `32px` (`calc(100vw - 32px)`).
  - Maximum content height: `80%` of viewport height (`max-h-[80vh]`) with internal scrolling for overflow.
  - Dialog close buttons must feature an accessible name (`aria-label="Close"`).
- **Motion & Reduced Motion**:
  - Micro-interactions: `150ms` – `250ms` duration.
  - Page/view transitions: Maximum `300ms` duration using standard `ease-out` timing.
  - Loading indicators: Use calm indeterminate spinners or skeleton screens; avoid competing concurrent animations.
  - Task state notifications: Use subtle, single-shot fade-in transitions; continuous pulsing or flashing is prohibited.
  - Accessibility: Full compliance with `prefers-reduced-motion: reduce` by disabling non-essential motion, translation, and rotation.

### 3.4 Task Lifecycle & Sign-in Monitoring Domains

- **Course Matrix & Batch Operations**:
  - Each course row renders: Course Name, Checkpoint Progress, Processing Status, Selection Checkbox, and Primary Action trigger.
  - Concurrency safety: Courses currently in an active processing state are automatically disabled from batch selection matrices to prevent duplicate task execution.
- **Task Lifecycle Finite State Machine**:
  - Permitted states:
    - `pending`
    - `running`
    - `waiting_daily_limit`
    - `stopping`
    - `stopped`
    - `success`
    - `partial_success`
    - `failed`
  - Every state representation must articulate three essential components:
    1. Underlying reason or triggering condition.
    2. Numerical/unit progress or definitive terminal outcome.
    3. Suggested immediate next step or remediation action.
- **Task Progress Polling & Snapshot Safeguards**:
  - Progress tracking operates via structured detail polling (`useTaskProgressPolling`).
  - Stale-data protection: Every poll response must compare `updatedAt` timestamps, discarding older out-of-order payloads to prevent state regression.
  - Terminal snapshot capture: Freeze terminal and progress state upon task conclusion.
  - Unmount cleanup: Polling timers and inflight requests must be aborted and cleaned up upon component unmount.
  - Authorization expiry: HTTP 401 responses immediately trigger `onUnauthorized` for clean session ejection and redirection.
- **Sign-in Monitoring Architecture**:
  - Unified operational surface combining real-time monitor controls and sign-in audit history.
  - Data ingestion: The full history dataset is fetched in a single query; sorting and pagination are executed entirely in-memory on the client.
  - **By-Time View**: Paginated timeline showing signed vs. total counts, jump-to-first/last, previous/next, and direct page navigation with lightweight directional transitions. Sorted latest-first.
  - Semantic vs. Category Colors: Category tokens (`sign-photo`, `sign-location`, `sign-code`) differentiate sign-in mechanisms; execution results exclusively use semantic status tokens (`success`, `warning`, `danger`).

---

## 4. Cross-Cutting Concerns

### 4.1 Accessibility (A11y)
- Automated focus traps and focus restoration in modal dialogs and slide-over drawers.
- Screen reader live regions (`aria-live="polite"` or `role="alert"`) for dynamic status changes, validation errors, and async task completions.
- Strict touch target bounding boxes (minimum `44px × 44px`) across all mobile interaction zones.

### 4.2 Security & Session Invalidation
- Authentication relies strictly on HTTP-only cookie sessions with `credentials: 'include'`. Bearer tokens are prohibited.
- Intercepted 401 responses trigger atomic state purge and invoke `onUnauthorized` to route users back to login without deadlocked UI states.

### 4.3 Resilience & Polling Efficiency
- Bounded client-side pagination and local filtering for sign-in logs prevent redundant network round-trips.
- Timestamp-fenced polling intervals prevent race conditions and memory leaks during prolonged background execution.

---

## 5. Alternatives Considered

| Dimension | Evaluated Option | Selected Decision | Rationale |
| :--- | :--- | :--- | :--- |
| **Task Detail Presentation** | Full-page Modal Dialog vs. Side Drawer (`Sheet`) | **Side Drawer (`Sheet`)** | Preserves background operational context and course matrix visibility while inspecting detailed task terminal logs. |
| **Real-time Task Streaming** | WebSocket Connection vs. Timestamp-Fenced Polling | **Timestamp-Fenced Polling** | Minimizes infrastructure complexity, provides automatic reconnection resilience, and eliminates stale-packet regression using `updatedAt` checks. |
| **Sign-in Log Pagination** | Server-side Query Pagination vs. Client-side In-memory | **Client-side In-memory** | Sign-in audit log volumes per active session are bounded; in-memory manipulation provides zero-latency view switching and filtering. |
| **Styling Architecture** | Ad-hoc Tailwind Classes vs. Centralized CSS Token Contract | **Centralized Token Contract (`src/index.css`)** | Eliminates visual fragmentation, guarantees dark/light theme consistency, and enforces WCAG AA contrast compliance across the entire surface. |
