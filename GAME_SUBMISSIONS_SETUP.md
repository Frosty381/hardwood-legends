# CYBER game submissions — setup and review

The game-upload page and private owner inbox are deployed in the CYBER GitHub Pages repository. They require one separate Supabase setup script before uploads can be accepted.

## One-time setup

1. Open the CYBER Supabase SQL Editor:
   https://supabase.com/dashboard/project/izixnrbnmqurmmywxefu/sql/new
2. Open the repository file [game-submissions-setup.sql](game-submissions-setup.sql).
3. Copy the entire file.
4. In Supabase, click **New query**. Replace any text in the editor with the contents of this file.
5. Click **Run** and check the result. Do not click Run repeatedly while a query is still running. If Supabase reports a technical error, wait for the service to recover and check the message before retrying.
6. Sign in to CYBER using the owner account email configured in the SQL and owner inbox page: `inasi01@s.tatachila.sa.edu.au`.

This script is separate from the Friends & Chat setup. It creates a private Storage bucket and the submission database table. It can be run independently.

## Fix "Bucket not found"

If the upload page reports that `cyber-game-submissions` was not found, open [repair-game-submissions-bucket.sql](repair-game-submissions-bucket.sql), copy the whole file into a new Supabase SQL Editor query, and click **Run**. Its final SELECT should show one row for `cyber-game-submissions`. Then refresh the upload page.

## Where submissions go

Players upload games at [submit-game.html](submit-game.html). New uploads are stored privately in the `cyber-game-submissions` bucket and listed in [game-submissions.html](game-submissions.html), which is restricted by database rules to the owner email above.

The owner inbox lets you create a short-lived private download link, read the game description, and set the submission status to Pending, Approved or Rejected with an optional note.

**This version does not send an email notification.** Check the private owner inbox to see new submissions.

## Upload limits

- File formats: `.html`, `.htm` and `.zip`.
- Maximum file size: 25 MiB.
- Files stay private; approval does not automatically publish or execute them.
- Inspect the code and assets before adding a game to the public CYBER library. Treat every upload as untrusted, and do not open an unknown HTML game while signed in to sensitive accounts.

## Changing the owner account

The owner email appears in both `game-submissions-setup.sql` and `game-submissions.html`. If the CYBER owner account uses a different email, update both places to the exact verified email for that account before running the SQL setup and using the inbox.
