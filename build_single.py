# -*- coding: utf-8 -*-
"""Bundles the whole site into ONE self-contained html file (hash-routed). Run: python3 source/build_single.py out.html"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import build
OUT = os.path.dirname(HERE)
css = open(os.path.join(OUT, "assets", "style.css"), encoding="utf-8").read()
js = open(os.path.join(OUT, "assets", "site.js"), encoding="utf-8").read()
views = {}
for name, t, p, body, s in build.all_pages():
    views[name[:-5]] = {"t": t, "p": p, "s": s, "h": body}
foot = ('<footer>%s | IT 107 Fundamentals of the Internet. Defensive use only: practice on your own accounts and lab machines, never on systems you do not own or have written permission to test. '
        'Tool and feature notes are current as of October 2026, so re-check before each term. Progress is saved only in your own browser.</footer>' % build.SITE)
router = """(function(){var V=window.VIEWS,main=document.getElementById('main');
function show(name,push){if(!V[name])name='index';var v=V[name];document.body.setAttribute('data-page',v.p);document.body.setAttribute('data-slug',v.s);
main.innerHTML=v.h+window.FOOT;document.title=v.t+' | The Continuity Project';window.scrollTo(0,0);window.CP_BOOT();
if(push){try{history.replaceState(null,'','#'+name);}catch(e){try{location.hash=name;}catch(x){}}}}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(!a)return;var m=(a.getAttribute('href')||'').match(/^([A-Za-z0-9_-]+)\\.html$/);if(m){e.preventDefault();show(m[1],true);}});
window.addEventListener('hashchange',function(){show(location.hash.slice(1));});
show(location.hash.slice(1)||'index');})();"""
page = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  '<title>Civil Defense Handbook: Digital Edition</title>'
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  '<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">'
  '<style>' + css + '</style></head><body data-page="index" data-slug="">'
  '<header class="bar"><div class="wrap"><a class="brand" href="index.html">' + build.LOGO + '<span>' + build.SITE + '<small>IT 107 | Digital Edition</small></span></a>'
  '<nav><a href="index.html">Briefings</a><a href="tonight.html">Do this tonight</a><a href="glossary.html">Glossary</a></nav></div></header>'
  '<div class="hazard"></div><main id="main" class="wrap"></main>'
  '<script>window.CP_SINGLE=true;window.MODS=' + build.js([{"n": m["n"], "slug": m["slug"], "title": m["title"]} for m in build.MODS]) +
  ';window.FOOT=' + build.js(foot) + ';window.VIEWS=' + build.js(views) + ';</script>'
  '<script>' + js.replace('</script', '<\\/script') + '</script><script>' + router + '</script></body></html>')
dest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(OUT, "single-file.html")
open(dest, "w", encoding="utf-8").write(page)
print("wrote", dest, len(page) // 1024, "KB")
