# Revigion

Spaced-repetition revision tracker. User adds questions under subjects; app schedules notifications to remind user to revise.

## Language

**Subject**:
A grouping of questions on a single topic (e.g. "DSA"). Owned by one user.
_Avoid_: Category, topic, folder.

**Question**:
A single item the user wants to revise. Belongs to one Subject. Has a fixed lifecycle of 5 Revisions.
_Avoid_: Card, item, note.

**Revision**:
One scheduled review of a Question. Each Question has exactly 5 Revisions across its lifecycle. R1 auto-completes on Question creation.
_Avoid_: Review, repetition, session.

**Revision Schedule**:
Gaps between Revisions, measured from previous completed Revision: R1→R2 = 3d, R2→R3 = 5d, R3→R4 = 10d, R4→R5 = 15d. All intervals relative to the previously completed Revision (not creation date).

**Completed Question**:
A Question whose 5th Revision is done. No further Revisions or notifications. Card shown light green.

**Due Today Question**:
A Question with next Revision due_date = today (User Timezone). Card shown blue.

**Missed Revision**:
A Revision whose due date has passed without completion. Question enters Missed state: yellow card, removed from notification queue, no future Revisions scheduled until missed one completes.

## Question Card States (precedence)
1. Completed → light green
2. Missed → yellow
3. Due Today → blue
4. Normal → transparent bg, gray border

**Revision Day**:
A calendar day on which a Question's next Revision is due. Notifications fire at fixed user-local slots 08:00, 12:00, 16:00, 20:00 until completion. Day boundaries evaluated in **User Timezone**.

**User Timezone**:
IANA timezone string stored on User profile; defaults to browser-detected TZ at signup, user-editable later. All Revision due dates stored as dates (not timestamps) and interpreted in this TZ.
