# CYBER Friends & Chat — one-time setup

The website files are in the CYBER GitHub Pages repository. Friend requests, messages and private call signalling also need database policies in the existing Supabase project.

## Run the database setup

1. Sign in to the Supabase dashboard for the project already used by CYBER.
2. Open **SQL Editor** and choose **New query**.
3. Open the repository file [social-setup-fixed.sql](social-setup-fixed.sql), copy the entire file and paste it into the SQL Editor.
4. Press **Run**. Wait for the query to finish. If Supabase shows an error, do not continue until that error is fixed.
5. Open the CYBER site, sign in with your normal account, then choose a username on Friends & Chat.

The project reference used by the existing CYBER website is `izixnrbnmqurmmywxefu`. The dashboard SQL Editor is at:

https://supabase.com/dashboard/project/izixnrbnmqurmmywxefu/sql/new

## What it adds

- A username-only player directory for signed-in CYBER users.
- Friend requests with accept, decline and cancel actions.
- Private one-to-one messages for accepted friends.
- Voice and video calls between accepted friends, using WebRTC media and private Supabase Realtime signalling.
- Realtime incoming message and request updates.
- Block and report tools, row-level security, and a basic message rate limit.

## Important

- Do not share or add a Supabase **service-role** key to the website. The existing public publishable key is the one used by the browser.
- The database rules restrict messages to accepted friends and stop either side of a block from messaging.
- Reports are stored in `cyber_reports` for the site owner to review. They are not automatically sent to an email address.
- Calls ask the browser for microphone permission; video calls also ask for camera permission. They only work on a secure HTTPS page and a network that permits WebRTC peer-to-peer media.
- The first calling version uses a public STUN server and does not include a TURN relay. Some restrictive networks, including some school networks, may block direct connections. Reliable calls on those networks need a separately configured TURN service; no TURN credentials are included.
- Calls are one-to-one. Group calls and voice chat rooms are not included.
