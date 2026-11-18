#!/usr/bin/env python3
"""Generate static GitHub Pages entries from the backend's verified tool routes."""
import argparse,json,html
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--catalogue',type=Path);p.add_argument('--check',action='store_true');a=p.parse_args()
manifest=root/'tool-pages.json'
if a.catalogue:
 entries=json.loads(a.catalogue.read_text())['entries'];routes=[{'path':e['path'],'name':e['name']}for e in entries]
 manifest.write_text(json.dumps(routes,ensure_ascii=False,separators=(',',':'))+'\n')
else:routes=json.loads(manifest.read_text())
routes += [{'path':'/tools','name':'Clinical tools'},{'path':'/tools/apache','name':'APACHE calculators'}]
for s,n in [('scorers','Clinical scores'),('calculators','Clinical calculators'),('criteria','Clinical criteria'),('references','Clinical references')]:routes.append({'path':'/tools/'+s,'name':n})
assert len({e['path']for e in routes})==len(routes)
for e in routes:
 page=root/e['path'].strip('/')/'index.html'
 content='<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>'+html.escape(e['name'])+' · SiliconDoctor</title>\n<link rel="stylesheet" href="/tool-page.css">\n<script defer src="/tool-page.js"></script>\n<main id="tool-page"></main>\n<noscript>Enable JavaScript to open the calculator.</noscript>\n'
 if a.check:assert page.read_text()==content,page
 else:page.parent.mkdir(parents=True,exist_ok=True);page.write_text(content)
print(len(routes),'tool addresses', 'verified'if a.check else 'generated')
