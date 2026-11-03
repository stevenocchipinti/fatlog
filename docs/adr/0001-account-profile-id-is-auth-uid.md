# The account holder's profile ID is their auth uid

Observations are keyed by profile (`/checkins/<profileId>`, `/dietRules/<profileId>`, …) so one signed-in account can record for several people, such as their children. The account holder's own profile uses their Firebase auth uid as its profile ID, and additional profiles get generated IDs. That way every record that existed before profiles (stored under `/<collection>/<uid>`) is already in the right place and nothing has to be migrated. Database rules allow access when `$profileId === auth.uid` or when `/profiles/<profileId>/owner` equals `auth.uid`.

## Considered Options

- **One signed-in account per person**, using a named Firebase app instance per account and switching between them. Rejected: children would need their own accounts (Google Family Link limits third-party sign-in), every device would need repeated sign-ins, and nothing would record that the accounts belong to one family.
- **Generated IDs for every profile, migrating existing data under them.** Rejected: an unnecessary migration of live data. A recent rules mistake had already caused data loss.

## Consequences

- Do not "tidy up" the account holder's profile to use a generated ID. That would orphan all of their historical data.
- Sharing a profile with a second account (for example a co-parent) later would mean replacing the single `owner` with a set of members. The keying of observations stays the same.
