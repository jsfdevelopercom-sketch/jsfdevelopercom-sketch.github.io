from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old_meta = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
new_meta = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">'
if s.count(old_meta) != 1:
    raise SystemExit(f'viewport meta match count={s.count(old_meta)}')
s = s.replace(old_meta, new_meta, 1)

css = '''
  /* AI Doc keyboard mode: the host owns the visible viewport. The iframe fills
     that viewport exactly; the embedded app must not be pushed below it. */
  body.aidoc-keyboard-overlay{overflow:hidden!important}
  body.aidoc-keyboard-overlay #panelAiDoc{
    position:fixed!important;margin:0!important;max-width:none!important;
    padding:0!important;gap:0!important;z-index:1000!important;
  }
  body.aidoc-keyboard-overlay #panelAiDoc iframe{
    display:block!important;width:100%!important;height:100%!important;
    min-height:0!important;max-height:none!important;border:0!important;border-radius:0!important;
  }
'''
style_close = '</style>'
if s.count(style_close) < 1:
    raise SystemExit('no style close tag')
s = s.replace(style_close, css + '\n' + style_close, 1)

marker = '<!-- SILICONDOCTOR_AIDOC_VIEWPORT_FIT -->'
start = s.find(marker)
if start < 0:
    raise SystemExit('viewport marker not found')
script_start = s.find('<script>', start)
script_end = s.find('</script>', script_start)
if script_start < 0 or script_end < 0:
    raise SystemExit('viewport script boundaries not found')
script_end += len('</script>')

new_block = r'''<!-- SILICONDOCTOR_AIDOC_VIEWPORT_FIT -->
<script>
(() => {
  const panel = document.getElementById('panelAiDoc');
  const tab = document.getElementById('mainTabAiDoc');
  const frame = panel ? panel.querySelector('iframe') : null;
  if (!panel || !tab || !frame) return;

  let fitRaf = 0;
  let keyboardMode = false;
  const baseline = { portrait: 0, landscape: 0 };

  function orientationKey() {
    return (screen.width || innerWidth) >= (screen.height || innerHeight) ? 'landscape' : 'portrait';
  }

  function viewportMetrics() {
    const vv = window.visualViewport;
    const top = vv ? Math.max(0, Math.round(vv.offsetTop)) : 0;
    const left = vv ? Math.max(0, Math.round(vv.offsetLeft)) : 0;
    const width = Math.max(1, Math.round(vv ? vv.width : window.innerWidth));
    const height = Math.max(1, Math.round(vv ? vv.height : window.innerHeight));
    return { top, left, width, height, bottom: top + height };
  }

  function clearKeyboardOverlay() {
    keyboardMode = false;
    document.body.classList.remove('aidoc-keyboard-overlay');
    for (const prop of ['position','top','left','width','maxWidth','maxHeight','zIndex']) {
      panel.style[prop] = '';
    }
  }

  function keyboardLikely(metrics) {
    const key = orientationKey();
    const current = metrics.height;
    let base = baseline[key] || current;
    if (!keyboardMode && current > base) base = baseline[key] = current;
    if (!baseline[key]) baseline[key] = current;
    const lost = Math.max(0, base - current);
    return lost > Math.max(90, base * .18);
  }

  function fitAiDocPanel() {
    fitRaf = 0;
    if (window.getComputedStyle(panel).display === 'none') {
      clearKeyboardOverlay();
      return;
    }

    const metrics = viewportMetrics();
    const keyboard = keyboardLikely(metrics);

    if (keyboard) {
      keyboardMode = true;
      document.body.classList.add('aidoc-keyboard-overlay');
      panel.style.position = 'fixed';
      panel.style.top = `${metrics.top}px`;
      panel.style.left = `${metrics.left}px`;
      panel.style.width = `${metrics.width}px`;
      panel.style.maxWidth = `${metrics.width}px`;
      panel.style.height = `${metrics.height}px`;
      panel.style.maxHeight = `${metrics.height}px`;
      panel.style.minHeight = '0';
      panel.style.overflow = 'hidden';
      panel.style.zIndex = '1000';
      return;
    }

    if (keyboardMode) clearKeyboardOverlay();
    const key = orientationKey();
    baseline[key] = Math.max(baseline[key] || 0, metrics.height);

    // Normal mode keeps the tabs/header visible and gives AI Doc exactly the
    // space that remains below its current top edge. No fixed minimum height.
    const panelTop = Math.max(metrics.top, panel.getBoundingClientRect().top);
    const available = Math.max(1, Math.floor(metrics.bottom - panelTop - 8));
    panel.style.height = `${available}px`;
    panel.style.minHeight = '0';
    panel.style.maxHeight = `${available}px`;
    panel.style.overflow = 'hidden';
  }

  function scheduleAiDocFit() {
    if (fitRaf) cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(fitAiDocPanel);
  }

  tab.addEventListener('click', () => {
    scheduleAiDocFit();
    setTimeout(scheduleAiDocFit, 80);
    setTimeout(scheduleAiDocFit, 260);
  });
  window.addEventListener('resize', scheduleAiDocFit, { passive: true });
  window.addEventListener('scroll', scheduleAiDocFit, { passive: true });
  window.addEventListener('orientationchange', () => {
    baseline.portrait = 0;
    baseline.landscape = 0;
    clearKeyboardOverlay();
    scheduleAiDocFit();
    setTimeout(scheduleAiDocFit, 260);
  }, { passive: true });
  window.addEventListener('pageshow', scheduleAiDocFit, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleAiDocFit, { passive: true });
    window.visualViewport.addEventListener('scroll', scheduleAiDocFit, { passive: true });
  }
  scheduleAiDocFit();
  setTimeout(scheduleAiDocFit, 120);
})();
</script>'''

s = s[:start] + new_block + s[script_end:]
p.write_text(s, encoding='utf-8')
print('keyboard viewport host patch applied')
