"""Injecte le logo (assets/logo.svg) dans src/index.html et versionne CSS/JS -> index.html"""
import re, pathlib, hashlib
root = pathlib.Path(__file__).parent
logo = (root / 'assets/logo.svg').read_text()
syms = ''.join(f'<symbol id="lg-{c}" viewBox="0 0 1212 882"><path fill-rule="evenodd" d="{d}"/></symbol>'
               for c, d in re.findall(r'<path class="lg-(\w+)" fill-rule="evenodd" d="([^"]+)"', logo))
html = (root / 'src/index.html').read_text().replace('{{LOGO}}', syms)
def ver(m):
    path = m.group(2)
    h = hashlib.md5((root / path).read_bytes()).hexdigest()[:8]
    return f'{m.group(1)}="{path}?v={h}"'
html = re.sub(r'(href|src)="((?:css|js)/[^"?]+\.(?:css|js))"', ver, html)
(root / 'index.html').write_text(html)
print('ok')
