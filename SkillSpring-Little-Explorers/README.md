# 🌼 SkillSpring: Little Explorers

An iPad-friendly, kid-first, browser-based learning adventure for ages **roughly 3–7**. Four short interactive mini-games help early learners practice letters, counting, shapes and basic facial-expression recognition. Pip the frog guides kids with spoken instructions (where supported).

**This is a prototype.** Learning outcomes have not been independently validated. Intended for play with a grown-up, not to replace teachers or developmental evaluation.

## Features
- 🦜 **Letter Lagoon:** uppercase matching, picture/initial-letter associations, lowercase matching.
- 🍎 **Counting Garden:** tap objects one-by-one to count 1–7 and then choose the number.
- 🧩 **Shape Safari:** identify shapes and continue simple alternating patterns.
- 🦊 **Feelings Forest:** recognize expressions from faces and descriptions.
- ⭐ One star per completed question, collectible stickers after four-question adventures.
- 🌱 Gentle three-level difficulty progression. Three first-try successes in a row raises difficulty; two practiced/corrected answers in a row lowers it (never below level 1). Correct answers are never required on the first try.
- 🗣️ Spoken prompts use built-in browser speech synthesis, if available.
- 📴 Offline-ready after first online load via service worker.
- 🔒 No accounts, ads, remote AI, analytics, or network data collection. Optional progress stored in browser `localStorage`.
- ♿ Large tap targets, keyboard navigation, labels, reduced-motion support, and screen-reader feedback.
- 🌻 Natural stopping point after 4 questions and a rest suggestion.

## Start in 30 seconds
1. Download this folder and unzip it.
2. Open `index.html` in a browser for a quick preview. **For reliable speech and offline testing**, serve it over `http://localhost` or GitHub Pages.
3. Simple local server (optional): `python3 -m http.server 8000`, then visit `http://localhost:8000`.
4. To put it in your GitHub repo, copy the files and `assets` folder into the repository root and commit.
5. Under **Settings → Pages** in GitHub, deploy from the main branch / root folder to publish.

## Files
- `index.html` — pages, navigation, accessible game layouts
- `style.css` — tablet/phone responsive visuals and animation
- `app.js` — question generation, difficulty, saved progress, voice, stickers
- `assets/pip.svg` — original vector mascot
- `assets/icon.svg` — app icon
- `manifest.webmanifest`, `sw.js` — installable/offline browser support
- `TESTING.md` — verification checklist
- `AI_DISCLOSURE_LOG.md` — AI contribution documentation

## What the team should improve
This starter is AI-generated. For a Congressional App Challenge submission, the students should **review, meaningfully modify, test, understand, and document** their own work; follow the current official rules for AI use and disclosure. Suggested contributions:
- Design and implement a fifth game (for example, **Rhythm River**, clapping and pattern identification) entirely yourselves.
- Record original, consented narration or design additional spoken cues.
- Create and test your own questions with teachers and parents.
- Improve the difficulty logic based on simple, ethical usability testing (without collecting children's personal information).
- Add thoughtful accessibility features and fix issues identified through testing.
- Make a demo video of the actual app and your technical contributions.

## Child privacy
The project does not ask for names, emails, grade, birthdays, photos, or voice recordings. It does not send personal information to any server. Stars and difficulty settings are kept in the local browser and can be deleted in the **For grown-ups** menu. Reinstalling, clearing browser data, or switching devices may erase progress.

## Important
Browser voice output depends on platform support, installed voices, and a user gesture. Buttons and emoji are still available with speech turned off. Emoji appearance may differ between devices.

© Project collaborators. Credit AI assistance according to competition rules.
