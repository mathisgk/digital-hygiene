# -*- coding: utf-8 -*-
"""Stamps out every page of the site from the content files. Run: python3 source/build.py"""
import json, os, html
from collections import OrderedDict
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
import sys
sys.path.insert(0, HERE)
from content1 import M1
from content2 import M2
from content3 import M3, TONIGHT, TOOLS

import quizbank
MODS = sorted(M1 + M2 + M3, key=lambda m: m["n"])
for _m in MODS: _m["quiz"] = quizbank.build(_m["n"])
def pad(n): return "%02d" % n
def fname(m): return "%s-%s.html" % (pad(m["n"]), m["slug"])
def js(o): return json.dumps(o, ensure_ascii=False).replace("</", "<\\/")
SITE = "The Continuity Project"
BOOK = "Civil Defense Handbook: Digital Edition"

WIDGET_TITLES = {"threat": "Threat model builder", "entropy": "Passphrase math", "browsers": "Lab results explorer",
  "vpn": "What can they see?", "dns": "DNS lookup simulator", "phish": "Spot the red flags",
  "clickfix": "Fake CAPTCHA demo", "encrypt": "Encryption explorer", "irorder": "Put the steps in order"}

LOGO = ('<svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="none" stroke="#F2B705" stroke-width="3"/>'
        '<polygon points="20,8 32,29 8,29" fill="#F2B705"/><polygon points="20,14 27,26 13,26" fill="#1F3A5F"/></svg>')

SVG = {}
SVG["mindset"] = '''<svg viewBox="0 0 560 250" role="img" aria-label="Three rings: prevent, detect, recover">
<circle cx="125" cy="125" r="115" fill="none" stroke="var(--blue)" stroke-width="3"/>
<circle cx="125" cy="125" r="80" fill="none" stroke="var(--red)" stroke-width="3"/>
<circle cx="125" cy="125" r="45" fill="var(--yellow-soft)" stroke="var(--ink)" stroke-width="3"/>
<text x="125" y="26" text-anchor="middle" font-size="13" fill="var(--ink)" font-weight="700">PREVENT</text>
<text x="125" y="63" text-anchor="middle" font-size="13" fill="var(--ink)" font-weight="700">DETECT</text>
<text x="125" y="130" text-anchor="middle" font-size="13" fill="var(--ink)" font-weight="700">RECOVER</text>
<text x="270" y="60" font-size="14" fill="var(--ink)"><tspan font-weight="700" fill="var(--blue)">Prevent:</tspan> updates, MFA, manager, ad blocker</text>
<text x="270" y="125" font-size="14" fill="var(--ink)"><tspan font-weight="700" fill="var(--red)">Detect:</tspan> breach alerts, login alerts, bank alerts</text>
<text x="270" y="190" font-size="14" fill="var(--ink)"><tspan font-weight="700">Recover:</tspan> backups, credit freeze, response plan</text>
</svg>'''
SVG["messaging"] = '''<svg viewBox="0 0 640 260" role="img" aria-label="Phone to server to phone showing in transit, at rest, and end-to-end">
<rect x="20" y="110" width="110" height="70" rx="8" fill="var(--card)" stroke="var(--blue)" stroke-width="3"/>
<text x="75" y="150" text-anchor="middle" font-size="14" fill="var(--ink)" font-weight="700">Your phone</text>
<rect x="265" y="110" width="110" height="70" rx="8" fill="var(--card)" stroke="var(--red)" stroke-width="3"/>
<text x="320" y="150" text-anchor="middle" font-size="14" fill="var(--ink)" font-weight="700">Server</text>
<rect x="510" y="110" width="110" height="70" rx="8" fill="var(--card)" stroke="var(--blue)" stroke-width="3"/>
<text x="565" y="150" text-anchor="middle" font-size="14" fill="var(--ink)" font-weight="700">Their phone</text>
<line x1="130" y1="145" x2="265" y2="145" stroke="var(--ink)" stroke-width="3" stroke-dasharray="6 4"/>
<line x1="375" y1="145" x2="510" y2="145" stroke="var(--ink)" stroke-width="3" stroke-dasharray="6 4"/>
<text x="197" y="135" text-anchor="middle" font-size="12" fill="var(--ink)">in transit (TLS)</text>
<text x="442" y="135" text-anchor="middle" font-size="12" fill="var(--ink)">in transit (TLS)</text>
<text x="75" y="205" text-anchor="middle" font-size="12" fill="var(--ink)">at rest: device</text>
<text x="320" y="205" text-anchor="middle" font-size="12" fill="var(--ink)">at rest: company holds keys</text>
<text x="565" y="205" text-anchor="middle" font-size="12" fill="var(--ink)">at rest: device</text>
<path d="M75 95 V60 H565 V95" fill="none" stroke="var(--green)" stroke-width="4"/>
<text x="320" y="48" text-anchor="middle" font-size="14" fill="var(--green)" font-weight="700">End to end: only these two phones hold the keys</text>
</svg>'''

def layout(title, page, body, slug="", depth_note=""):
    return ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      '<title>%s | %s</title><meta name="description" content="Interactive defensive cybersecurity and digital hygiene briefings for IT 107.">'
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
      '<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">'
      '<link rel="stylesheet" href="assets/style.css"></head>'
      '<body data-page="%s" data-slug="%s"><a class="skip" href="#main">Skip to content</a>'
      '<header class="bar"><div class="wrap"><a class="brand" href="index.html">%s<span>%s<small>IT 107 | Digital Edition</small></span></a>'
      '<nav><a href="index.html">Briefings</a><a href="tonight.html">Do this tonight</a><a href="glossary.html">Glossary</a></nav></div></header>'
      '<div class="hazard"></div><main id="main" class="wrap">%s'
      '<footer>%s | IT 107 Fundamentals of the Internet. Defensive use only: practice on your own accounts and lab machines, never on systems you do not own or have written permission to test. '
      'Tool and feature notes are current as of October 2026, so re-check before each term. Progress is saved only in your own browser.</footer></main>'
      '<script>window.MODS=%s;</script><script src="assets/site.js"></script></body></html>'
      % (html.escape(title), SITE, page, slug, LOGO, SITE, body, SITE,
         js([{"n": m["n"], "slug": m["slug"], "title": m["title"]} for m in MODS])))

def module_page(i, m):
    prev_m = MODS[i-1] if i > 0 else None
    next_m = MODS[i+1] if i < len(MODS)-1 else None
    pts = "".join("<li>%s</li>" % p for p in m["points"])
    widget = ""
    if m.get("widget"):
        widget = ('<h2>Field exercise</h2><p>%s</p><div class="widget" data-widget="%s"><span class="wt">%s</span><div class="wbody"></div></div>'
                  % (m["demo"], m["widget"], WIDGET_TITLES[m["widget"]]))
    else:
        widget = '<h2>Field exercise</h2><div class="demo"><span class="lbl">Try it</span>%s</div>' % m["demo"]
    svg = ('<div class="panel">%s</div>' % SVG[m["slug"]]) if m["slug"] in SVG else ""
    quiz = [{"q": q, "o": o, "a": a, "e": e} for (q, o, a, e) in m["quiz"]]
    cards = [[t, d] for (t, d) in m["cards"]]
    nav = '<div class="nav2">'
    nav += ('<a href="%s"><small>Previous</small>%s. %s</a>' % (fname(prev_m), pad(prev_m["n"]), prev_m["title"])) if prev_m else '<a href="index.html"><small>Back</small>All briefings</a>'
    nav += ('<a class="next" href="%s"><small>Next</small>%s. %s</a>' % (fname(next_m), pad(next_m["n"]), next_m["title"])) if next_m else '<a class="next" href="tonight.html"><small>Final step</small>Do this tonight</a>'
    nav += "</div>"
    body = ('<section class="mh"><span class="tag">Briefing %s | %s</span><h1 style="margin-top:.5em">%s</h1>'
            '<div class="objective"><b>Mission objective.</b> %s</div></section>'
            '<h2>Field report</h2><ul class="points">%s</ul>%s'
            '<h2>Myth versus reality</h2><div class="mvr"><div class="myth"><span class="lbl">Myth</span>&ldquo;%s&rdquo;</div><div class="reality"><span class="lbl">Reality</span>%s</div></div>'
            '%s'
            '<h2>Flashcards</h2><p>Tap a card to flip it.</p><div id="flash"></div>'
            '<h2>Check your understanding</h2><div id="quiz"></div>'
            '<div class="takeaway"><span class="lbl">Leave this on the board</span>%s</div>'
            '<p style="text-align:center"><button id="done-btn" class="cta">Mark this briefing complete</button></p>%s'
            '<script type="application/json" id="cards-data">%s</script><script type="application/json" id="quiz-data">%s</script>'
            % (pad(m["n"]), html.escape(m["threat"]), m["title"], m["objective"], pts, svg, m["myth"], m["reality"], widget,
               m["takeaway"], nav, js(cards), js(quiz)))
    return ("%s. %s" % (pad(m["n"]), m["title"]), "module", body, m["slug"])

def index_page():
    parts = OrderedDict()
    for m in MODS: parts.setdefault(m["part"], []).append(m)
    grid = ""
    for p, ms in parts.items():
        grid += '<div class="part">%s</div><div class="grid">' % p
        for m in ms:
            grid += ('<a class="mod" href="%s" data-slug="%s"><span class="st">new</span><span class="no">BRIEFING %s</span><h3>%s</h3><p>%s</p></a>'
                     % (fname(m), m["slug"], pad(m["n"]), m["title"], html.escape(m["short"])))
        grid += "</div>"
    tools = "".join("<tr><td><b>%s</b></td><td>%s</td></tr>" % (a, b) for a, b in TOOLS)
    body = ('<section class="hero"><span class="stamp">Declassified</span><p class="kicker" style="margin-top:18px">The Continuity Project | IT 107</p>'
            '<h1>%s</h1><p class="lead">Twenty briefings on defending your accounts, devices, and data. Mitigation of risk, not total elimination. '
            'In 1964 the problem was keeping communications alive after an attack. Today it is keeping your digital life alive after the breach that is coming anyway.</p>'
            '<p><a class="cta" href="%s">Start Briefing 01</a> &nbsp; <a class="btn alt" href="tonight.html" style="text-decoration:none;display:inline-block;padding:11px 18px">Do this tonight</a></p></section>'
            '<div class="panel"><b>Your progress</b><div class="meter" id="meter"><i></i></div><span id="meter-label" class="small"></span>'
            '<p style="margin:12px 0 0"><a class="btn" href="progress.html" style="text-decoration:none;display:inline-block">View my progress report</a> '
            '<button class="btn alt reset-btn" data-reset type="button">Start fresh (new student on this computer)</button></p></div>'
            '<div class="panel"><b>How each briefing works</b><ol><li>Read the field report.</li><li>Run the field exercise.</li><li>Flip the flashcards and take the quiz.</li><li>Mark it complete.</li></ol></div>'
            '<input class="search" id="search" type="search" placeholder="Search briefings (try: VPN, phishing, backups)" aria-label="Search briefings">'
            '%s<h2>Tools we recommend</h2><table class="t"><tr><th>Job</th><th>Pick</th></tr>%s</table>'
            % (BOOK, fname(MODS[0]), grid, tools))
    return ("Home", "index", body, "")

def tonight_page():
    items = [{"t": t, "slug": s} for t, s in TONIGHT]
    body = ('<section class="mh"><span class="tag">Action list</span><h1 style="margin-top:.5em">Do this tonight</h1>'
            '<p class="lead">Ten things matter most. Do them, check them off, and stop optimizing. Your checkmarks save in this browser.</p></section>'
            '<div class="panel"><div class="meter" id="meter"><i></i></div><span id="meter-label" class="small"></span></div>'
            '<ul class="chk" id="chk"></ul><div class="takeaway"><span class="lbl">Leave this on the board</span>Security is a budget of effort. Spend it where the risk is.</div>'
            '<script type="application/json" id="tonight-data">%s</script>' % js(items))
    return ("Do this tonight", "tonight", body, "")

def glossary_page():
    g = []
    for m in MODS:
        for t, d in m["cards"]: g.append((t, d, m))
    g.sort(key=lambda x: x[0].lower())
    rows = "".join('<div class="panel gl"><b>%s</b> <a href="%s" class="small">briefing %s</a><p style="margin:.3em 0 0">%s</p></div>'
                   % (html.escape(t), fname(m), pad(m["n"]), html.escape(d)) for t, d, m in g)
    body = ('<section class="mh"><span class="tag">Reference</span><h1 style="margin-top:.5em">Glossary</h1></section>'
            '<input class="search" id="search" type="search" placeholder="Search terms" aria-label="Search terms">%s' % rows)
    return ("Glossary", "glossary", body, "")

def progress_page():
    items = [{"t": t, "slug": s} for t, s in TONIGHT]
    body = ('<section class="mh"><span class="tag">Self-reported record</span><h1 style="margin-top:.5em">My progress report</h1>'
            '<p>Type your name, then print this page or save it as a PDF to turn in. Progress is saved in the browser and on the device you worked on, '
            'so open this page there. It is a self-reported record.</p></section>'
            '<div class="panel"><label for="r-name"><b>Student name</b></label>'
            '<input class="nameinput" id="r-name" type="text" placeholder="First and last name" autocomplete="off">'
            '<p class="small" style="margin:8px 0 0">IT 107 Fundamentals of the Internet | Digital Hygiene | <span id="r-date"></span></p></div>'
            '<div id="report"></div>'
            '<p><button class="cta" id="r-print" type="button">Print or save as PDF</button> '
            '<button class="btn alt reset-btn" data-reset type="button">Start fresh (new student on this computer)</button></p>'
            '<script type="application/json" id="tonight-data">%s</script>' % js(items))
    return ("My progress report", "progress", body, "")

def all_pages():
    pages = [(fname(m),) + module_page(i, m) for i, m in enumerate(MODS)]
    pages += [("index.html",) + index_page(), ("tonight.html",) + tonight_page(), ("glossary.html",) + glossary_page(), ("progress.html",) + progress_page()]
    return pages

def write(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f: f.write(content)

if __name__ == "__main__":
    for name, t, p, body, s in all_pages(): write(name, layout(t, p, body, s))
    open(os.path.join(OUT, ".nojekyll"), "w").close()
    print("built", len(MODS), "briefings")
