# Improvement Backlog — Inner Stance Buddy

Goal: Raise grade from B → A- / A

---

## ITEM-01 Split service layer into domains

- Goal: Improve architecture
- Files: src/lib/exerciseService.ts → multiple services

Done when:

- No file > ~400 lines
- Each service has 1 domain only

---

## ITEM-02 Introduce orchestrators for multi-domain flows

- Goal: Improve architecture clarity
- Files: new /services/orchestrators/

Flows:

- fetchDashboardData
- copyWeekToQuarter
- fetchTrackerWithCheckIns

Done when:

- No multi-domain logic inside services
- Flow is easy to trace

---

## ITEM-03 Extract useDashboard hook

- Goal: Reduce page complexity
- Files: DashboardPage.tsx

Done when:

- Page mostly UI
- Logic moved to hook

---

## ITEM-04 Extract usePowerPage hook

- Goal: Reduce page complexity
- Files: PowerPage.tsx

Done when:

- Page simplified
- State + logic moved out

---

## ITEM-05 Add service layer tests

- Goal: Improve testing score
- Files: services/

Focus:

- dashboard logic
- answer save/update
- tracker logic

Done when:

- Each service has tests
- Includes failure cases

---

## ITEM-06 Add tests for hooks

- Goal: Improve reliability
- Files:
  - useDashboard
  - useAuth
  - useLegalStatus

Done when:

- Loading / success / error covered

---

## ITEM-07 Fix fetchTrackerWithCheckIns performance

- Goal: Improve performance
- File: tracker logic

Done when:

- Parallel calls (Promise.all)
- Fewer round-trips

---

## ITEM-08 Replace read-then-write with upsert

- Goal: Improve performance + clarity
- Files:
  - saveAnswer
  - toggleCheckIn

Done when:

- No unnecessary select before write

---

## ITEM-09 Remove unsafe non-null assertions

- Goal: Improve error handling
- Files: affected service logic

Done when:

- No risky "!" on external data

---

## ITEM-10 Improve error handling consistency

- Goal: Improve reliability
- Files: key flows (dashboard, tracker, answer)

Done when:

- Errors explicit
- No silent failures
- User feedback exists

---

## ITEM-11 Cleanup repo artifacts

- Goal: Improve technical quality signal

Fix:

- remove CSV files from src/data
- delete "New folder"
- fix .sql.sql filename
- update appConfig branding

Done when:

- Repo looks clean and intentional
