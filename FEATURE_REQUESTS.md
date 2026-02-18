# My Pocket Watch - Feature Requests & Enhancements
**Date:** 2026-02-18
**From:** Boss
**Priority:** High - All items for near-term roadmap

---

## 🎯 HIGH PRIORITY - UX Improvements

### 1. Loading States / Indicators
**Status:** MISSING
**Priority:** HIGH
**Impact:** User Experience

**Problem:**
When clicking navigation or submitting forms, the page appears unresponsive for 2-3 seconds. Users can't tell if their action registered or if the app is processing.

**Solution:**
Implement loading indicators across the board:
- **Navigation clicks:** Show loading spinner/skeleton
- **Form submissions:** Button changes to "Processing..." with spinner
- **Page transitions:** Loading overlay or progress bar
- **API calls:** Loading states for data fetching

**Implementation:**
- Create reusable `<LoadingSpinner />` component
- Add loading states to all buttons
- Use React Suspense for page-level loading
- Add skeleton loaders for data tables
- Implement optimistic UI updates where appropriate

**Locations to add:**
- Login/signup form submissions
- Worker add/edit modals
- Profile updates
- Schedule changes
- All navigation links
- Dashboard data loading

**Estimated Effort:** 4-6 hours

---

## 📚 DOCUMENTATION & SUPPORT

### 2. Support / Help Center Page
**Status:** NEEDED
**Priority:** HIGH
**Route:** `/support` or `/help`

**Components Needed:**

**A. Knowledge Base**
- Searchable articles
- Categories:
  - Getting Started
  - Workers & Time Tracking
  - Schedules & Calendar
  - Payroll & Reports
  - Integrations
  - Troubleshooting
- Article format: Title, content, screenshots, related articles

**B. FAQ Section**
- Common questions and answers
- Categories matching KB structure
- Expandable/collapsible design

**C. Contact Support / Create Case**
- Support ticket form:
  - Name, Email, Company
  - Issue Category (dropdown)
  - Priority (Low/Medium/High/Urgent)
  - Subject
  - Description (rich text)
  - Attach files/screenshots
  - Submit button
- Success message with ticket number
- Email confirmation sent

**D. Support Dashboard (for admins)**
- View submitted cases
- Case status tracking
- Support team responses

**Navigation:**
- Add "Help Center" to main navigation menu
- Footer link to support
- Contextual help icons throughout app

**Estimated Effort:** 12-16 hours

---

### 3. Technical Documentation
**Status:** PLANNING
**Priority:** MEDIUM-HIGH
**Purpose:** Position for acquisition

**Documentation Types:**

**A. Customer-Facing:**
- User guides
- Video tutorials
- API documentation (if applicable)
- Integration guides
- Best practices

**B. Internal Support:**
- Admin procedures
- Troubleshooting guides
- Customer service scripts
- Escalation procedures
- Known issues log

**C. Technical/Developer:**
- Architecture overview
- Database schema
- API reference
- Deployment procedures
- Security documentation
- Backup/recovery procedures
- Third-party integrations (Twilio, Supabase, Vercel)

**Tools to Consider:**
- GitBook / Docusaurus for docs
- Loom for video tutorials
- Postman for API docs

**Estimated Effort:** 20-30 hours (ongoing)

---

## 🔧 INTEGRATIONS & CONFIGURATION

### 4. Twilio Configuration / Integrations Page
**Status:** NEEDED
**Priority:** MEDIUM-HIGH
**Route:** `/integrations` or `/settings/integrations`

**Purpose:**
Give customers visibility into their Twilio setup without exposing sensitive credentials.

**Features:**

**A. Twilio Overview**
- Connection status (Connected ✅ / Not Connected ❌)
- Phone number in use
- Message credits remaining (if available via API)
- Recent message log (last 24 hours)
- Error logs (failed messages)

**B. Configuration (View Only)**
- Webhook URLs configured
- SMS capabilities enabled
- WhatsApp capabilities enabled
- Caller ID verification status

**C. Test Messaging**
- Send test SMS to verify setup
- View delivery status

**D. Usage Stats**
- Messages sent (today/week/month)
- Messages received
- Cost tracking (if available)

**E. Troubleshooting**
- Common issues and fixes
- Link to Twilio dashboard (external)
- Support contact

**Navigation:**
Accessible from new menu structure:
- Profile
- Account Settings
- Help Center
- **Integrations** ← New

**Estimated Effort:** 8-12 hours

---

## 👥 STAFF MANAGEMENT ENHANCEMENTS

### 5. Guided Worker Onboarding Workflow
**Status:** NEEDS REDESIGN
**Priority:** HIGH
**Impact:** Core UX improvement

**Problem:**
Current "Add Worker" is a single form. Not intuitive for new users. Doesn't guide them through the full setup process.

**Solution:**
Multi-step guided workflow in a modal/wizard format.

**Workflow Steps:**

#### **Step 1: Worker Information**
- First Name, Last Name
- Phone, Email
- Position/Role
- Hourly Rate
- Hire Date
- Upload photo (optional)
- **Button:** "Next" →

#### **Step 2: Team & Assignment**
- **Assign to Team** (dropdown or hierarchy tree selector)
- **Job Site / Location** (if applicable)
- **Reports to** (select manager)
- **Working with** (select co-workers/crew)
- **Button:** "Back" | "Next" →

#### **Step 3: Schedule Setup**
- **Option A:** "Use Template"
  - Select from pre-defined templates:
    - Monday-Friday 8am-5pm
    - Monday-Friday 7am-4pm
    - Weekend Shift (Sat-Sun)
    - Night Shift
    - Custom
- **Option B:** "Set Custom Schedule"
  - Weekly calendar view
  - Click days to toggle
  - Set start/end times per day
  - Set break duration
- **Preview** schedule on mini calendar
- **Button:** "Back" | "Next" →

#### **Step 4: Review & Confirm**
- Summary of all entered data:
  - Worker info card
  - Team assignment card
  - Schedule preview (week view)
- **Buttons:**
  - "Edit" links for each section (goes back to that step)
  - "Back" (to step 3)
  - **"Save & Add Worker"** (primary action)

#### **Step 5: Success & Next Actions**
- ✅ "Worker Added Successfully!"
- **Automatic redirect to:** Staff Hierarchy Page
- **Special animation:**
  - Page loads with hierarchy tree
  - **Focus animation:** Zoom/highlight the new worker's position
  - Tree background blurs slightly
  - New worker's node pulses or glows
  - **Modal overlay** showing:
    - Worker name & photo
    - Their position in hierarchy
    - Quick stats (schedule, team, etc.)
    - **Button:** "View Full Hierarchy" or "Close"
  - Clicking close/backdrop → tree comes back into focus, zoom out to full view

**Additional Features:**
- **Progress indicator** at top of modal (Step 1 of 4, progress bar)
- **Save draft** capability (if user closes mid-workflow)
- **Validation** at each step before allowing "Next"
- **Back button** preserves entered data
- **Keyboard navigation** (Enter to continue, Esc to cancel)

**Estimated Effort:** 20-24 hours

---

## 📅 CALENDAR ENHANCEMENTS

### 6. Make Calendar More Valuable
**Status:** NEEDS ENHANCEMENT
**Priority:** MEDIUM-HIGH

**Current Problem:**
Calendar page exists but doesn't add much value beyond viewing schedules.

**Proposed Features:**

#### **A. Real-Time Scheduling Interface**
- **Drag-and-drop** scheduling
  - Drag worker card onto calendar to create shift
  - Drag edges to adjust times
  - Drag to move shift to different day
- **Real-time updates** (via Supabase Realtime)
  - Other admins see changes instantly
  - Workers see their updated schedules immediately
- **Color-coded** by team/position/worker
- **Conflict detection:**
  - Warn if scheduling overlaps
  - Show overtime alerts
  - Highlight understaffed days

#### **B. Preview & Approval Workflow**
- **Draft mode:** Changes are saved as "draft"
- **Preview:** Show what schedule will look like before publishing
- **Compare:** Side-by-side view of current vs. proposed schedule
- **Publish:** Admin clicks "Publish Schedule"
  - Sends notifications to affected workers
  - Updates calendar view
  - Creates audit log entry

#### **C. Worker Drill-Down (Modal Workflow)**
- **Click on scheduled shift** → Opens worker detail modal
- Modal shows:
  - Worker information
  - Current week's schedule
  - Time entries for selected period
  - Performance metrics
  - **Edit button** → Opens worker configuration
  - **Quick actions:**
    - Copy schedule to another week
    - Swap with another worker
    - Cancel shift
    - Add note
- **Navigation:** 
  - Modal has breadcrumb: Calendar → [Worker Name]
  - "Back to Calendar" button
  - **Or:** Use browser back (modal is a route `/calendar/worker/:id`)

#### **D. Additional Value-Adds**
- **Template Management:**
  - Save recurring schedules as templates
  - "Apply Template" to multiple workers
  - "Recurring Schedule" setup (repeats weekly)

- **Schedule Forecasting:**
  - Project labor costs for upcoming week/month
  - Show estimated overtime
  - Capacity planning (understaffed/overstaffed alerts)

- **Integration with Time Tracking:**
  - Compare scheduled hours vs. actual clocked hours
  - Highlight discrepancies
  - "Schedule vs. Actual" report

- **Smart Suggestions:**
  - AI/ML suggests optimal schedules based on historical data
  - Recommends filling open shifts
  - Suggests shift swaps to optimize coverage

- **Mobile-Friendly:**
  - Workers can view their schedules on mobile
  - Request time off from calendar
  - Swap shifts with coworkers (pending approval)

#### **E. Calendar Views**
- **Day view:** Hour-by-hour breakdown
- **Week view:** 7-day overview (default)
- **Month view:** High-level schedule overview
- **Worker view:** See one worker's full schedule
- **Team view:** Filter by team/department

**Estimated Effort:** 16-24 hours

---

## 🎨 UI/UX ENHANCEMENTS

### 7. Navigation Menu Structure
**Proposed Structure:**

**Main Navigation (Top Bar):**
- Dashboard / Live Status
- Staff
- Schedule / Calendar
- Payroll
- Reports

**User Menu (Profile Dropdown - Top Right):**
- Profile
- Account Settings
- Integrations (Twilio, etc.)
- Help Center
- Sign Out

**Mobile Navigation:**
- Hamburger menu with all main + user menu items

**Estimated Effort:** 4-6 hours

---

### 8. Hierarchy Tree Visualization
**Enhancements for Staff Page:**

- **Interactive tree view**
  - Expandable/collapsible branches
  - Zoom in/out controls
  - Pan/drag to navigate large trees
  
- **Focus animations** (as described in workflow)
  - Blur background
  - Highlight specific branch
  - Smooth transitions

- **Search/filter:**
  - Search for worker by name
  - Filter by team/position/status
  - Highlight search results in tree

- **Quick actions on nodes:**
  - Hover to see worker card
  - Click to open detail modal
  - Right-click for context menu (edit, remove, etc.)

**Estimated Effort:** 12-16 hours

---

## 📊 PRIORITY MATRIX

### Must Have (P0) - Next Sprint
1. **Loading states** - 4-6 hours
2. **Support/Help Center** - 12-16 hours
3. **Guided worker workflow** - 20-24 hours

**Total:** 36-46 hours (~1 week sprint)

### Should Have (P1) - Following Sprint
4. **Twilio/Integrations page** - 8-12 hours
5. **Calendar enhancements** - 16-24 hours
6. **Navigation menu restructure** - 4-6 hours

**Total:** 28-42 hours (~1 week sprint)

### Nice to Have (P2) - Future Sprints
7. **Hierarchy tree enhancements** - 12-16 hours
8. **Technical documentation** - Ongoing (20-30 hours)

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Core UX (Week 1)
- Loading states everywhere
- Support page with contact form
- Basic knowledge base structure
- Guided worker workflow

### Phase 2: Integrations & Calendar (Week 2)
- Twilio configuration page
- Calendar drag-and-drop
- Worker drill-down modals
- Preview/publish workflow

### Phase 3: Polish & Docs (Week 3)
- Navigation menu improvements
- Hierarchy tree enhancements
- Customer documentation
- Internal support docs

### Phase 4: Technical Docs (Week 4 - Ongoing)
- Technical architecture docs
- API documentation
- Developer guides
- Deployment procedures

---

## 📝 NOTES

**Acquisition Readiness:**
The focus on comprehensive documentation (customer, support, technical) is strategic for future acquisition. Well-documented products command higher valuations and make due diligence smoother.

**UX Philosophy:**
All enhancements focus on **guided workflows** and **reducing cognitive load**. New users should feel confident and supported throughout the product.

**Real-time Features:**
Supabase Realtime makes real-time collaboration possible. Multiple admins can work on schedules simultaneously without conflicts.

---

## ✅ ACTION ITEMS

1. **Immediate:** Continue testing with clean database
2. **This Week:** Implement loading states
3. **Next Week:** Start on support page + worker workflow
4. **Ongoing:** Document everything for future acquisition

---

_Feature requests captured and prioritized. Ready for implementation planning._
