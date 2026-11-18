"""Injecte les symboles du logo (assets/logo.svg) dans src/index.html -> index.html"""
import re, pathlib
root = pathlib.Path(__file__).parent
logo = (root / 'assets/logo.svg').read_text()
syms = ''.join(f'<symbol id="lg-{c}" viewBox="0 0 1212 882"><path fill-rule="evenodd" d="{d}"/></symbol>'
               for c, d in re.findall(r'<path class="lg-(\w+)" fill-rule="evenodd" d="([^"]+)"', logo))
tpl = (root / 'src/index.html').read_text()
(root / 'index.html').write_text(tpl.replace('{{LOGO}}', syms))
print('ok')
