// Site presentation only; canonical widget owns intents, gates, form state and transport.
import {mountMediaViewer} from './media-viewer.mjs';

export function mount({language}) {
  mountMediaViewer({language});
  let discoveryObserver;
  let widgetObserver;
  const decorate = root => {
    const title = root.querySelector('#ya-widget-title');
    if (title) {
      const text = language.text('theme.gundogdu.support.title');
      const nodes = [...title.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
      if (nodes.length) {
        if (nodes[0].data !== text) nodes[0].data = text;
        nodes.slice(1).forEach(node => node.remove());
      } else title.append(document.createTextNode(text));
    }
    const launcher = root.querySelector('.ya-widget-launcher-copy strong');
    const launcherText = language.text('theme.gundogdu.support.title');
    if (launcher && launcher.textContent !== launcherText) launcher.textContent = launcherText;
    if (root.querySelector('.ya-widget-home')) {
      for (const [selector, key] of [
        ['.ya-widget-welcome .ya-widget-kicker', 'theme.gundogdu.support.title'],
        ['.ya-widget-welcome p', 'theme.gundogdu.support.text'],
      ]) {
        const node = root.querySelector(selector);
        const text = language.text(key);
        if (node && node.textContent !== text) node.textContent = text;
      }
    }
    const actions = root.querySelector('.ya-widget-actions');
    if (actions) {
      const priority = node => {
        const request = ['pension_reservation','restaurant_reservation','general_info','dealer_application'].indexOf(node.dataset.yaRequestType);
        if (request !== -1) return request;
        if (node.dataset.yaView === 'directions') return 4;
        if (node.dataset.yaView === 'whatsapp') return 5;
        return 6;
      };
      const current = [...actions.children];
      const sorted = [...current].sort((a,b) => priority(a) - priority(b));
      if (sorted.some((node,index) => node !== current[index])) sorted.forEach(node => actions.append(node));
    }
    document.querySelectorAll('[data-theme-widget-trigger]').forEach(button => {
      button.hidden = !window.YardimciAsistanWidget || root.hidden;
    });
  };
  const attach = () => {
    const root = document.getElementById('yardimci-asistan-widget');
    if (!root) return;
    discoveryObserver?.disconnect();
    widgetObserver?.disconnect();
    decorate(root);
    widgetObserver = new MutationObserver(() => decorate(root));
    widgetObserver.observe(root, {childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  };
  if (document.getElementById('yardimci-asistan-widget')) attach();
  else {
    discoveryObserver = new MutationObserver(attach);
    discoveryObserver.observe(document.body, {childList:true});
  }
  window.addEventListener('pagehide', () => { discoveryObserver?.disconnect(); widgetObserver?.disconnect(); });
  window.addEventListener('pageshow', event => { if (event.persisted) attach(); });
}
