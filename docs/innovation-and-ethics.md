# iMCQ: Innovation and ethics

## The problem
Campus life at Macquarie is spread over many places. Students find societies, food and events on separate sites, posters and chats. New students and international students miss out the most.

> [Add your own evidence here: survey results, interview quotes, or a link to the research you did. The rubric asks for solution ideas "grounded in research or user insights", so this part must come from you.]

## The solution
iMCQ is a mobile-first campus map. It puts buildings, societies, restaurants and events in one place.

Students can:
- Browse the map as a guest, with no account.
- Follow societies and see their events in one Calendar.
- Add their own private plans.
- Add an event to Google, Apple or Outlook calendar.
- Use the app in English, 简体中文, Español or Tiếng Việt.

Society leaders can post events and photos for their own society.

## What is new
- **One map for everything.** Societies, food and events are tied to real buildings. Pick a building and see what is held there.
- **Your Calendar shows only what you follow.** It is not a noisy feed.
- **Guests are first-class.** You can use the map before you give any data.
- **Built for many languages from the start.** Most campus tools are English only.

## Why the design fits the users
| User need | How iMCQ answers it |
| :--- | :--- |
| "I don't know what is on." | One Calendar for followed societies. |
| "I don't know where it is." | Every society and restaurant links to a building on the map. |
| "I don't want to sign up just to look." | Guest view. |
| "English is not my first language." | Four languages. |
| "I use my phone." | Mobile-first layout, 44px tap targets. |
| "Societies need a simple way to post." | Leaders post events in one form. |

## Ethical safeguards
**Privacy**
- Private plans are protected by row-level security. Only the owner can read them.
- Users can delete their account. Their plans and photos are deleted too.
- The password is never stored by the app and never kept in the browser.
- Guests give no data.

**Security**
- The browser holds only a public key. All data rules are enforced by the database.
- Roles are checked in the database, not just in the page.
- Raw error messages are logged, not shown to users.

**Fairness and inclusion**
- Guests can see the map, societies and restaurants.
- Four languages.
- Large tap targets, readable text sizes and visible focus rings.

**Transparency**
- Messages say why a login is needed, for example "Log in to follow societies".
- Users can see which society a leader leads.
- Deleting an account asks the user to type DELETE, so they know it is final.

**Human oversight**
- A person (an admin) approves every society leader. Leaders are not approved automatically.
- Admins can approve or reject each request.
- A leader can only edit their own society's events.

## Known limits (honest list)
- Photos on private plans are stored in a public bucket. They are hard to guess but not truly private.
- Event photos and cover photos are not moderated. There is no report button yet.
- There is no privacy notice or consent text yet.
- The mcqAI assistant is not built. When it is, answers must be labelled as AI and may be wrong.
- Several features were tested only as a guest or with fake logins. Real leader and admin accounts still need testing.

## Next steps
1. Add a short privacy notice on the login page.
2. Add a "Report" button on events and photos, and an admin review list.
3. Move private plan photos to a private bucket.
4. Label mcqAI answers as AI-generated.
5. Test the leader and admin flows with real accounts.

## Prototype evidence
- Live site: https://mcq-i-map.vercel.app
- Screens to include in the report: map, Societies, Restaurants, Calendar, Add event, Settings, login page.
- Workflow to draw: sign up, request leader, admin approves, leader posts, follower sees event in the Calendar.
