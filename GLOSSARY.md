# Fatlog

Fatlog tracks body, diet, bowel and symptom observations over time so changes can be reviewed against dates.

## Language

**Waist measurement**:
The circumference of the user's waist, recorded in centimeters as part of a body metrics check-in.
_Avoid_: Waste measurement

**Food group**:
A broad category of food used to describe diet patterns over time, rather than an individual food, meal, calorie count, or macro.
_Avoid_: Meal, specific food, macro

**Diet rule**:
A possibly open-ended date range during which a food group is intended to be part of the user's regular diet.
_Avoid_: Meal plan, diet entry, diet plan period

**Diet exception**:
A dated observation that the user ate from a food group in a way that is notable against the regular diet, whether or not that food group has an active diet rule.
_Avoid_: Cheat meal, food log

**Profile**:
A person whose observations are recorded, such as the account holder or one of their children. Every observation belongs to exactly one profile. An account always has its own profile and may manage additional profiles for people who do not sign in themselves. The account's own profile cannot be removed; other profiles are archived rather than deleted.
_Avoid_: User, account, member, child account

**Active profile**:
The profile currently being viewed and recorded against on a device.
_Avoid_: Current user, logged-in user

**Tracker**:
A kind of observation that can be enabled or disabled per profile: Metrics, Diet, Bowel movements, or Symptoms. A profile always has at least one tracker enabled, and all are enabled by default. Disabling a tracker hides it; it does not discard its observations.
_Avoid_: Tab, module, feature

**Bowel movement**:
A timestamped observation that the profile passed a stool, rated with a Bristol type and optionally annotated with a note.
_Avoid_: Stool entry, poo log

**Bristol type**:
The 1–7 rating of a bowel movement's form according to the Bristol stool chart, from 1 (separate hard lumps) to 7 (entirely liquid).
_Avoid_: Stool score, rating

**Symptom episode**:
A period of being unwell, described by a free-text symptom name, starting at a point in time and optionally ending at a later one, with an optional note. An episode without an end is ongoing.
_Avoid_: Symptom entry, illness, sickness log
