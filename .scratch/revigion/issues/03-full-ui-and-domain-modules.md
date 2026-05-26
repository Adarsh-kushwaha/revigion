# 03 — Full UI from Revigion.html + Revision Scheduler + Question State Machine

Status: ready-for-agent
Type: AFK

## What to build

Full application UI matching `Revigion.html` reference, wired end-to-end to Supabase (SDK reads + Server Action writes), plus two pure deep modules that drive scheduling and card state.

### Deep modules

**Revision Scheduler** — pure function.

Interface (conceptual):
```
nextDueDate(input: {
  lastCompletedAt: Date,
  nextIndex: 2 | 3 | 4 | 5,
  userTimezone: string,
}): Date  // due_date as user-local calendar date
```
Rules (locked in grilling):
- Gaps relative to previous completed Revision: index 2 = +3d, 3 = +5d, 4 = +10d, 5 = +15d.
- Late completion re-anchors: next due_date = late completion date + gap.
- All math in user TZ, result is a date (not timestamp).

**Question State Machine** — pure function.

Interface:
```
questionState(input: {
  revisions: { index, due_date, completed_at }[],
  today: Date,            // user-local
  userTimezone: string,
}): 'Completed' | 'Missed' | 'DueToday' | 'Normal'
```
Precedence: Completed (R5.completed_at set) > Missed (any non-completed revision with due_date < today) > DueToday (next revision due_date = today) > Normal.

### Screens (per Revigion.html)

**Home Screen**
- Header: app name + profile icon (dropdown from #02).
- Top-right Add Subject button → modal (name required, description optional).
- Subject cards listed created-date desc.
  - Card content: title, "N questions", description trimmed to 20 chars + "…".
  - Kebab on card: Rename (modal) / Delete (confirm modal showing question count, hard cascade).
  - Card click → Subject Questions Screen.
- Empty state: `"No subjects yet. Tap + to add one."`

**Subject Questions Screen**
- Header: subject name + "N questions" subtitle.
- Top-right Add Question button → modal (title required, link_url optional, description optional).
- Question cards.
  - Card content: title trimmed to 20 chars, created date, "N revisions left" (5 - completed count).
  - 5 revision circles on right; completed = green with white check, pending = empty. Sequential.
  - Kebab: Rename / Delete (confirm cascade).
  - Card click → Question Screen.
  - Card background:
    - Completed → light green
    - Missed → yellow (with warning copy: "You missed the revision. Complete it now, otherwise the next revision cycle will never start and you may forget this question.")
    - DueToday → blue
    - Normal → transparent + gray border
- Empty state: `"No questions yet. Tap + to add one."`

**Question Screen**
- Header: question title.
- Info row: "Completed N / Remaining M".
- Inline-editable fields: title, link_url, description. Single Save button activates on any change, persists all three.
- Start Revision button visible only when state = DueToday OR Missed. Tap → button disabled with 5-second client-side countdown (resets if user navigates away — no persistence) → Complete Revision button enables. Tap Complete → server action marks revision complete (sets completed_at), Scheduler computes next due_date, UI refreshes.
- Revision history list at bottom: each completed revision with completion date.

### Server Actions

- `createSubject(name, description)`
- `renameSubject(id, name)`
- `deleteSubject(id)` — cascade.
- `createQuestion(subjectId, title, linkUrl?, description?)` — inserts question + 5 revision rows. Revision 1: `completed_at = now`. Revision 2: `due_date = Scheduler.nextDueDate({ lastCompletedAt: now, nextIndex: 2, userTimezone })`. Revisions 3-5: `due_date = null`.
- `updateQuestion(id, { title?, linkUrl?, description? })`
- `deleteQuestion(id)` — cascade revisions.
- `completeRevision(revisionId)` — sets completed_at; if next index ≤ 5, sets revisions[next].due_date via Scheduler; if completed index = 5, no-op.

### Reads (Supabase JS SDK direct, RLS-scoped)

Home, Subject Questions, Question Screen all subscribe-once (no realtime) to relevant rows; refresh-on-focus.

## Acceptance criteria

- [ ] Home Screen lists Subjects with correct counts, description trimming, empty state, kebab menu actions.
- [ ] Subject CRUD works (create / rename / delete-with-cascade-confirm); RLS prevents cross-user access.
- [ ] Subject Questions Screen renders all cards with correct 5-circle progress and trimmed titles.
- [ ] Question CRUD works including auto-R1 and R2 due_date set per Scheduler.
- [ ] Question Screen inline edit + Save persists all three fields.
- [ ] Start Revision button hidden except on DueToday or Missed states.
- [ ] 5-second countdown enforced client-side; resets on navigate-away.
- [ ] Completing a revision writes completed_at and (if not R5) computes next due_date via Scheduler.
- [ ] Card colors match state precedence in all four states.
- [ ] Missed-state card shows warning copy verbatim.
- [ ] Revision history list shows each completed revision with date.
- [ ] All UI matches Revigion.html visual reference.

### Tests

- [ ] Unit tests for **Revision Scheduler**: on-time R2-R5 schedule, late completion re-anchoring, all four indices, DST boundary crossing in a non-UTC TZ, year-boundary date.
- [ ] Unit tests for **Question State Machine**: all 4 states + precedence (Completed > Missed > DueToday > Normal), midnight boundary in user TZ, freshly-created question (R1 done, R2 pending).

## Blocked by

- #02

