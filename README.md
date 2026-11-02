# The Continuity Project: Civil Defense Handbook, Digital Edition

Interactive defensive cybersecurity and digital hygiene site for IT 107. Twenty briefings, each with a field report, a hands-on exercise, flashcards, and a quiz. Plain HTML, CSS, and JavaScript. No build step needed to host it.

## Look at it on your computer
1. Extract the zip first. Do not open index.html from inside the zip, or the styling will not load.
2. Open the extracted folder and double-click index.html.

## Put it on GitHub Pages
1. Create a new public repository on GitHub.
2. Upload everything in this folder to the repository (Add file, Upload files).
3. In the repository, open Settings, then Pages.
4. Under the publishing source, choose Deploy from a branch, pick the main branch and the root folder, and save.
5. After a minute or two the live address appears on that same page.

## Change the content
Briefing text lives in content1.py, content2.py, and content3.py in the source folder. Quiz questions live in quizbank.py, which places the correct answer in a balanced A to D position for you. Edit them, then run:

    python3 source/build.py

That regenerates every page from the same template. Commit and push, and the site updates.

To build one standalone file that opens by double-clicking, with no folder needed:

    python3 source/build_single.py Digital-Hygiene-Handbook.html

## Notes
- Progress and quiz scores save only in each student's own browser. Nothing is sent anywhere.
- The widgets are teaching simulations. Nothing in them touches the real clipboard, network, or passwords.
- Tool and feature notes are current as of October 2026. Re-check browsers, VPN plans, and phone settings before each term.
- Defensive use only. Practice on your own accounts and lab machines.
