Revigion App

II want to create a revision app that sends notifications to remind me which questions I need to revise. This will be a mobile-first PWA built using Next.js, Supabase, and Firebase Cloud Messaging. The app should be very simple, minimalist, and easy to use — no fancy features minimal style and feature app.


UI REFRENCE
Fetch this design file, read its readme, and implement the relevant aspects of the design. https://api.anthropic.com/v1/design/h/uWZoxTJQGtPOoninLwPkuQ?open_file=Revigion.html
Implement: Revigion.html

1. Authentication
* Simple Google Login authentication.
2. Home Screen
After logging in, the user will see a Home Screen with:
* A header containing the app name.
* A user profile icon on the top-right corner.
Subject Cards
The Home Screen will display cards representing subjects the user wants to revise.
Example:
* Subject: DSA
* Title: “Data Structures and Algorithms”
Each subject card will contain:
* Subject title
* Number of questions added
* A trimmed description (maximum 20 characters)
Add Subject
On the top-right corner, there will be an “Add Subject” button.
When clicked:
* A modal opens.
* User enters:
    * Subject name
    * Description
* On submit:
    * A new subject card is created.
The user should also have options to:
* Rename a subject
* Delete a subject

Navigation
Subject cards are clickable. Clicking a card opens the Subject Questions Screen.

3. Subject Questions Screen
This screen will contain:
* Subject name at the top
* Subtitle showing the number of questions
* A button on the top-right to add a new question

Add Question Modal
Clicking the add button opens a modal with:
1. Question title (required)
2. Link URL (optional)
3. Description textarea (optional)
After submission, the question is added to the subject.

Question Cards
Each question card should display:
* Question title (trimmed to 20 characters)
* Created date
* Number of revisions left

Revision Progress UI
On the right side of the card:
* Show 5 revision circles
* When a question is created:
    * The first circle is automatically completed
    * Green background with a white check icon
* As revisions are completed:
    * Remaining circles get filled sequentially
Question cards should also be clickable.

4. Question Screen
Clicking a question card opens the Question Screen.
This screen will contain:
* Question title at the top
* Information showing:
    * Completed revisions
    * Remaining revisions
Editable Fields
* Link URL
* Description textarea
When changes are made:
* Save button becomes active
* User must click Save to persist changes
Revision Flow
If the current day is a revision day:
* Show a “Start Revision” button
* After clicking it:
    * Wait 5 seconds
    * Then show a “Complete Revision” button
* Clicking “Complete Revision” marks the revision as completed
* Also at bottom show the revision progress history with date it completed

Missed Revision Logic
If the user misses a revision day:
* Show a warning message:“You missed the revision. Complete it now, otherwise the next revision cycle will never start and you may forget this question.”
* The question card turns yellow
* It remains yellow until the missed revision is completed
* It will not return to the normal blue state until completion

CRUD Operations
The user should be able to:
* Rename questions
* Delete questions
* Perform all CRUD operations

5. Notification Logic
Each question follows a fixed revision lifecycle.
Revision Schedule
When a question is added:
* The first revision is considered completed by default.
Future revisions are scheduled as follows:
1. After 3 days
2. After 5 days from the previous completed revision
3. After 10 days
4. After 15 days
After all revisions are completed:
* The question is marked as completed
* No more notifications are sent
* The question card turns light green

Notification Rules
* Notifications are sent every 4 hours until the revision is completed.
* Notifications are only sent for questions whose revision is due on the current day.
* If the user misses a revision:
    * The question enters a “Missed” state
    * It is removed from the notification queue
    * No future revision cycles are scheduled until the missed revision is completed
Deep Linking
Clicking a notification should:
* Open the app directly
* Navigate to the specific Question Screen
Platform Support
Notifications should:
* Be high priority
* Work properly on both Android and iOS devices
* Use Firebase Cloud Messaging (FCM) for push notifications

