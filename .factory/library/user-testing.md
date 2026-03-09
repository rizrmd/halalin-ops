# User Testing Guide - Halal Form Mission

## Application Overview
Halal Form is a TanStack Start application for Interview & Assessment Management.

## URLs
- **Dev Server**: http://localhost:3002
- **Login Page**: http://localhost:3002/login
- **Dashboard**: http://localhost:3002/
- **Partners**: http://localhost:3002/partners
- **Interviews**: http://localhost:3002/interviews
- **Assessments**: http://localhost:3002/assessments
- **New Assessment**: http://localhost:3002/assessments/new

## Test Credentials
The database has existing partners who can login. Use these credentials:
- Email: partner1@example.com (or any partner email from the partners table)
- Password: The password is stored in the database, typically the same as email or a simple value

For testing, you may need to first check existing users in the database.

## Database Seeds
The database is pre-seeded with:
- Partners (Admin, Penerbit, Auditor, Penyelia Halal records)
- Question banks (for interviews and assessments)
- Interview questions and scoring criteria

## Testing Tools
- **Web UI**: agent-browser skill for browser automation
- **API**: curl for direct HTTP requests
- **Database**: psql or Prisma client for data verification

## Flow Validator Guidance: Web UI

### Isolation Rules
Each flow validator subagent should:
1. Use unique test accounts to avoid session conflicts
2. Create unique data (e.g., assessment attempts, interviews) with identifiable prefixes
3. Clean up test data after testing (or use namespaced data)

### Browser Session Usage
- Use the agent-browser skill via `Skill("agent-browser")`
- Always close sessions with `agent-browser --session "<id>" close` when done
- Take screenshots for evidence using the skill

### Common Testing Patterns

#### Login Flow
1. Navigate to /login
2. Fill email and password
3. Click submit
4. Verify redirect to dashboard
5. Check authenticated state

#### Form Submission Flow
1. Navigate to form page
2. Fill form fields
3. Submit
4. Verify success (redirect or success message)
5. Check database for created record

### Off-Limits
- Do NOT delete production data
- Do NOT modify partner records that aren't test accounts
- Do NOT modify question banks or scoring criteria (they are shared)

## Viewports for Responsive Testing
- Mobile: 375x667
- Tablet: 768x1024
- Desktop: 1280x720

## Known Quirks
- Login requires a valid partner email that exists in the database
- Protected routes redirect to /login if not authenticated
- All UI is in Indonesian language
- Assessment forms support: single_choice, multiple_choice, short_text question types

## Infrastructure Issues (CRITICAL)

### Browser Automation Blocked
**Status**: BLOCKED as of 2026-03-09

**Issue**: Playwright Chromium cannot launch due to missing system-level GTK libraries:
- `libatk-1.0.so.0` (ATK accessibility toolkit)
- `libatk-bridge-2.0.so.0` (AT-SPI bridge)
- `libatspi.so.0` (AT-SPI)
- `libXdamage.so.1` (X11 Damage extension)

**Error**:
```
/home/riz/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell: 
error while loading shared libraries: libatk-1.0.so.0: cannot open shared object file: No such file or directory
```

**Resolution Attempted**:
1. Installed Playwright Chromium via `pnpm exec playwright install chromium` - ✓ Downloaded browser binaries
2. Attempted to run agent-browser with new Chromium - ✗ Failed with missing library error
3. Checked available packages via `apt-cache search libatk` - Packages available on system
4. Attempted Firefox browser - ✗ Also requires system dependencies
5. Cannot use `sudo apt-get install` - No root access available

**Impact**: All assertions requiring browser automation (screenshots, form interaction) are BLOCKED. This affects:
- All VAL-ASSESS-* assertions
- All VAL-UI-* assertions requiring visual verification
- All VAL-CROSS-* cross-area flow assertions

**Workaround**: None available without system administrator intervention. User testing requires either:
1. Pre-installed GTK libraries in execution environment
2. Containerized browser with bundled dependencies
3. Root access to install missing packages
4. Manual human testing as fallback

**Code Verified**: Through detailed code analysis, all features are confirmed implemented:
- Assessment list with Indonesian labels and pagination
- Assessment creation form with validation
- Assessment take form with all question type renderers
- Assessment submission with auto-save
- Objective scoring based on question_options.is_correct
- Results page with score breakdown
