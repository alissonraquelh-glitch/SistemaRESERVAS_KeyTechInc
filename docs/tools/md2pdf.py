# Uso: python3 docs/tools/md2pdf.py docs/MANUAL_USUARIO.md  (requiere: pip install markdown; google-chrome en PATH)
import sys, markdown, subprocess, pathlib
src = pathlib.Path(sys.argv[1]).resolve(); out = src.with_suffix('.pdf')
import re
text = src.read_text(encoding='utf8')
lines = text.split('\n'); out_lines = []
for i, l in enumerate(lines):
    is_item = re.match(r'^\s*([-*]|\d+\.)\s', l)
    prev = out_lines[-1] if out_lines else ''
    if is_item and prev.strip() and not re.match(r'^\s*([-*]|\d+\.)\s', prev) and not prev.startswith('|'):
        out_lines.append('')
    out_lines.append(l)
html = markdown.markdown('\n'.join(out_lines), extensions=['tables','fenced_code','nl2br','sane_lists'])
css = """body{font-family:'DejaVu Sans',Arial,sans-serif;font-size:10.5pt;line-height:1.45;color:#1f2937;margin:0}
h1{color:#b91c1c;border-bottom:3px solid #b91c1c;padding-bottom:6px;font-size:20pt}
h2{color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:3px;margin-top:22px;font-size:14pt}
h3{color:#b91c1c;font-size:12pt}
table{border-collapse:collapse;width:100%;margin:8px 0;font-size:9pt}th,td{border:1px solid #d1d5db;padding:4px 6px;text-align:left;vertical-align:top}
th{background:#f3f4f6}code{background:#f3f4f6;padding:1px 3px;border-radius:3px;font-size:8.5pt}
img{display:block;margin:6px auto;max-width:100%;max-height:120mm;width:auto;border:1px solid #d1d5db;border-radius:6px;margin:6px 0}
pre{background:#f6f8fa;border:1px solid #e5e7eb;border-radius:4px;padding:8px;white-space:pre-wrap;font-size:8.5pt}pre code{background:none;padding:0}
h2,h3{page-break-after:avoid}img,table{page-break-inside:avoid}@page{margin:16mm 14mm}"""
tmp = src.with_suffix('.tmp.html')
tmp.write_text(f'<!doctype html><html lang="es"><meta charset="utf-8"><style>{css}</style><body>{html}</body></html>', encoding='utf8')
subprocess.run(['google-chrome','--headless=new','--no-sandbox','--disable-gpu','--no-pdf-header-footer',f'--print-to-pdf={out}',tmp.as_uri()],check=True,capture_output=True)
tmp.unlink(); print(out)
