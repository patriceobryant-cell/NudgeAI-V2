# NudgeAI

A warm, private relationship companion for remembering the people who matter. Add the people in your
circle, set a rhythm for staying in touch, save birthdays and anniversaries, log the moments you
actually showed up, browse tailored ideas, and schedule nudges — all kept in your own browser.

## Pages

- **Dashboard** — one suggested action for the person who most needs attention, a connection score,
  what is due next, who has gone quiet, and upcoming dates.
- **People** — searchable, filterable and sortable circle with a linkable profile for each person
  (`#/people/<id>`) showing their facts, open nudges, tailored ideas and moment history.
- **Reminders** — counted views for overdue, today, upcoming and completed nudges, grouped by date,
  with inline complete, snooze, edit and delete. Repeating nudges roll to their next occurrence.
- **Ideas** — a bank of thoughtful gestures filtered by category and tailored to a chosen person,
  with save, copy and schedule actions.
- **Settings** — your name, light/dark/system theme, browser notification permission and a test
  notification, storage usage, JSON export and import, sample data, and a full local reset.

## Development

```bash
npm install
npm run dev
```

Create a production build with `npm run build` and preview it with `npm run preview`.

`npm run check` runs a server-side render and logic suite that renders every page, dialog and form,
exercises every store action, and asserts the date and derived-state helpers. It needs no browser.

## Privacy and data

Everything lives in `localStorage` under a versioned key; nothing is sent to a server. Data saved by
earlier versions is migrated automatically on first load. Browser notifications are opt-in, are
delivered while a tab is open, and are de-duplicated so the same nudge does not fire twice.
