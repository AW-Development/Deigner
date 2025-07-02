import { renderPrebidTab }    from './popup/tabs/prebid.js';
import { renderTamTab }       from './popup/tabs/tam.js';
import { renderNetworkTab }   from './popup/tabs/network.js';
import { renderTargetingTab } from './popup/tabs/targeting.js';
import { renderIdsTab }       from './popup/tabs/ids.js';
import { renderOpensinceraTab } from './popup/tabs/opensincera.js';
import { renderSettingsTab }  from './popup/tabs/settings.js';
import { noData }             from './popup/ui-helpers.js';

const $stats                = document.getElementById('stats');
const $prebidTabContent     = document.getElementById('prebid-tab');
const $tamTabContent        = document.getElementById('tam-tab');
const $networkTabContent    = document.getElementById('network-tab');
const $targetingTabContent  = document.getElementById('targeting-tab');
const $idsTabContent        = document.getElementById('ids-tab');
const $opensinceraTabContent= document.getElementById('opensincera-tab');
const $settingsTabContent   = document.getElementById('settings-tab');

let payload = { network: [], page: {} };

const DEBUG = true;
function dbg(...args) { if (DEBUG) console.log('[AdInspector]', ...args); }

async function collectData() {
  $stats.textContent = 'Collecting…';
  clearAllTabBodies();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    $stats.textContent = 'No active tab found.';
    noData($prebidTabContent, 'No active tab.');
    dbg('No active tab, exiting.');
    return;
  }

  // 1. Get network data (background)
  let network = [];
  try {
    network = await chrome.runtime.sendMessage({ action: 'getNetworkAdData', tabId: tab.id });
    dbg('Network data', network);
  } catch (e) {
    dbg('Network data error:', e);
  }

  // 2. Run robust collector in the page context
  let page = {};
  try {
    const [inj] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      args: [2000], // Wait up to 2s for pbjs
      func: function collector(waitMs) {
        const t0 = performance.now(); let tries = 0;
        return new Promise(res => {
          (async function loop() {
            tries++;
            const pbjsFound = typeof window.pbjs !== 'undefined';
            if (pbjsFound) {
              // If pbjs is found, collect its data, then also collect storage data
              const pbjsData = buildPrebidData();
              const storageData = getPageStorageData();
              return res({ pbjs: pbjsData, storage: storageData, locationHostname: location.hostname });
            }
            if (performance.now() < t0 + waitMs) {
              await new Promise(r => setTimeout(r, 100)); loop();
            } else {
              // If pbjs not found, just collect storage data
              const storageData = getPageStorageData();
              res({ pbjs: { ok: false, reason: 'Prebid.js global object (pbjs) not found on page.' }, storage: storageData, locationHostname: location.hostname });
            }
          })();

          function buildPrebidData() {
            if (typeof pbjs === 'undefined') {
              return { ok: false, reason: 'pbjs object not available during build phase.' };
            }
            try {
              const adUnits = pbjs._adUnits || [];
              const tgt = pbjs.getAdserverTargeting?.() || {};
              const win = pbjs.getAllWinningBids?.() || [];
              const resp = pbjs.getBidResponses?.() || {};
              const cfg = pbjs.getConfig?.() || {};
              const userIds = pbjs.getUserIdsAsEids?.() || [];
              const userConsent = pbjs.getUserConsent?.() || {};
              const bids = Object.values(resp).flatMap(r => r.bids);
              const bidders = [...new Set(bids.map(b => b.bidder))];

              const bidStatusCounts = bids.reduce((acc, bid) => {
                acc[bid.statusMessage] = (acc[bid.statusMessage] || 0) + 1;
                return acc;
              }, {});

              const timedOutBidders = bids.filter(b => b.statusMessage === 'Bid timed out').map(b => b.bidder);
              const uniqueTimedOutBidders = [...new Set(timedOutBidders)];

              return {
                ok: true,
                adUnits: adUnits, targeting: tgt, winningBids: win, bidResponses: resp, config: cfg,
                userIds: userIds, userConsent: userConsent,
                stats: {
                  totalBids: bids.length,
                  uniqueBidders: bidders.length,
                  bidStatusCounts: bidStatusCounts,
                  timedOutBidders: uniqueTimedOutBidders,
                },
                meta: { wait: Math.round(performance.now() - t0) }
              };
            } catch (e) {
              return { ok: false, reason: `Error reading Prebid.js data: ${e.message}. Is pbjs_debug=true?` };
            }
          }

          function getPageStorageData() {
              const localStorageData = {};
              try {
                  for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      localStorageData[key] = localStorage.getItem(key);
                  }
              } catch (e) { /* LocalStorage access denied or error */ }

              const sessionStorageData = {};
              try {
                  for (let i = 0; i < sessionStorage.length; i++) {
                      const key = sessionStorage.key(i);
                      sessionStorageData[key] = sessionStorage.getItem(key);
                  }
              } catch (e) { /* SessionStorage access denied or error */ }

              return { localStorage: localStorageData, sessionStorage: sessionStorageData };
          }
        });
      }
    });
    page = inj.result;
    dbg('Page data', page);
  } catch (e) {
    page = { pbjs: { ok: false, reason: 'Failed to collect Prebid.js.' } };
    dbg('Script injection error', e);
  }

  // 3. Pass robust data to your modular renderers
  payload = { network, page };
  dbg('Payload for renderers', payload);
  renderAllTabs();
  $stats.textContent = 'Data loaded.';
}

function renderAllTabs() {
  dbg('renderAllTabs: rendering with payload', payload);
  renderPrebidTab   ($prebidTabContent,    { page: payload.page });
  renderTamTab      ($tamTabContent,       { network: payload.network });
  renderNetworkTab  ($networkTabContent,   { network: payload.network });
  renderTargetingTab($targetingTabContent, { page: payload.page, network: payload.network });
  renderIdsTab      ($idsTabContent,       { page: payload.page, network: payload.network });
}

function clearAllTabBodies() {
  $prebidTabContent.textContent     =
  $tamTabContent.textContent        =
  $networkTabContent.textContent    =
  $targetingTabContent.textContent  =
  $idsTabContent.textContent        =
  $opensinceraTabContent.textContent=
  $settingsTabContent.textContent   = '';
}

async function switchTab(tabId) {
  dbg('Switching to tab', tabId);
  document.querySelectorAll('.tab-button').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tabId));
  if (tabId === 'settings-tab') {
    renderSettingsTab($settingsTabContent);
  } else if (tabId === 'opensincera-tab') {
    $opensinceraTabContent.innerHTML = 'Loading...';
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const domain = tab?.url ? extractRootDomain(tab.url) : (payload.page?.locationHostname || '');
    chrome.storage.sync.get(['opensinceraApiKey'], ({ opensinceraApiKey }) =>
      renderOpensinceraTab($opensinceraTabContent, domain, opensinceraApiKey)
    );
  }
}

function extractRootDomain(url) {
  try {
    const u = new URL(url);
    const parts = u.hostname.split('.').reverse();
    if (parts.length >= 2) return parts[1] + '.' + parts[0];
    return u.hostname;
  } catch { return url; }
}

document.getElementById('btn-refresh').onclick = collectData;
document.getElementById('btn-clear').onclick   = () => {
  payload = { network: [], page: {} };
  clearAllTabBodies();
  $stats.textContent = '(cleared)';
  dbg('Cleared all data');
};
document.getElementById('btn-count').onclick   = async () => {
  const phrase = document.getElementById('phrase').value.trim();
  if (!phrase) { alert('Enter a phrase'); return; }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    args: [phrase],
    func: (p) => {
      const perf = performance.getEntriesByType('resource').map(e => e.name.toLowerCase());
      const count = perf.filter(u => u.includes(p.toLowerCase())).length;
      return { count, total: perf.length };
    }
  }, ([r]) => {
    if (!r || !r.result) { alert('Unable to count resources'); return; }
    alert(`“${phrase}” found in ${r.result.count} of ${r.result.total} resources`);
  });
};

document.querySelectorAll('.tab-button').forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
);

document.addEventListener('DOMContentLoaded', () => {
  collectData();
  switchTab('prebid-tab');
});