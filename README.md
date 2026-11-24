# Web Development — A5 server

Express / TypeScript companion to Yingzi Zhang's `webdev-client`. Work is on branch `a5` in a separate sibling repository.

## Run locally

```sh
npm install
npm run dev
# or npm start
```

The default port is 4000. In the client set `NEXT_PUBLIC_HTTP_SERVER=http://localhost:4000`, then start Next.js. `.env` is optional locally; `.env.example` documents the settings. A temporary session secret is generated for local development if none is configured.

```sh
npm run typecheck
npm test
```

## Included routes

- `/`, `/hello`, `/lab5/welcome`
- Lab arithmetic: `/lab5/add/:a/:b`, subtract, multiply, divide; `/lab5/calculator?operation=add&a=2&b=3`
- Lab assignment and module object reads and property changes
- Lab todos: list, ID lookup, completed filter, instructional GET changes, and JSON POST / PUT / DELETE with 400 / 404 handling
- Kambaz accounts: sign in, sign up, profile, profile update, sign out, faculty user management
- Courses, course-specific modules and assignments, enrollment and course members

Kambaz read-only course, module and assignment APIs are public for the course grader. Editing courses/modules/assignments requires a faculty session. Students can manage their own enrollments; faculty can manage course members. API responses never include passwords. The public signup form creates a student; it cannot grant itself a faculty role.

Fictional textbook demo accounts (do not enter real passwords or personal information):

| Username | Demo password | Role |
| --- | --- | --- |
| iron_man | stark123 | Student |
| nick_fury | fury123 | Faculty |

## Chapter 5 storage and limits

Collections and sessions live in process memory. Browser refreshes retain changes while this Express process runs; restarting or redeploying resets them. This is a classroom demonstration, not a production authentication system: the fictional demo credentials use the chapter's plain-string comparison, and the session store is Express's development MemoryStore. MongoDB and permanent persistence belong to the next chapter. Legacy GET mutation URLs exist only to demonstrate the book's first exercises; the Kambaz application uses POST, PUT and DELETE.

## Hosting settings

For Render, select this repository's `a5` branch, Build `npm ci`, Start `npm start`, and the free instance if available. Runtime package `tsx` is included in dependencies.

- `SERVER_ENV=production`
- `CLIENT_URL` = the actual Vercel `a5` origin, no trailing slash; multiple explicit origins can be comma-separated
- `SESSION_SECRET` = a newly generated secret set only in the host dashboard, never committed
- `PORT` is supplied by the hosting platform

Production session cookies use HTTPS, `HttpOnly`, and `SameSite=None` for Vercel-to-Render requests. Client HTTP requests must send credentials. Third-party-cookie blocking can prevent cross-site login; test the actual deployed browser flow. Set the client `NEXT_PUBLIC_HTTP_SERVER` to the actual deployed server HTTPS origin and rebuild the client. No deployed URL is claimed in this repository until deployment is verified.

Implementation assistance: OpenAI Codex helped draft and check this A5 implementation. Seed course content was copied from the existing A4 classroom project. This note does not claim that generated code was independently authored or reviewed by the student.
