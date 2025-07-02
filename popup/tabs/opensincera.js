// popup/tabs/opensincera.js
import { createSection, createTable, noData } from '../ui-helpers.js';

// domain = string, opensinceraApiKey = string
export function renderOpensinceraTab(element, domain, opensinceraApiKey) {
  element.innerHTML = '';
  if (!domain) {
    noData(element, 'No domain detected for this page.');
    return;
  }
  if (!opensinceraApiKey) {
    noData(element, 'No OpenSincera API key set. Add it in Settings.');
    return;
  }
  element.innerHTML = 'Fetching OpenSincera data...';
  fetch(`https://open.sincera.io/api/publishers?domain=${domain}`, {
    headers: { 'Authorization': `Bearer ${opensinceraApiKey}` }
  })
    .then(resp => {
      if (resp.status === 404)
        throw new Error('No OpenSincera data found for this domain.');
      if (!resp.ok)
        throw new Error('OpenSincera API error: ' + resp.statusText);
      return resp.json();
    })
    .then(data => {
      const section = createSection(`OpenSincera Publisher Stats for <b>${data.name || domain}</b>`, element, {
        dataToExport: data,
        exportFilename: 'opensincera_data'
      });
      const headers = ['Key', 'Value'];
      const rows = Object.entries(data).map(([key, value]) => [
        key,
        `<pre>${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</pre>`
      ]);
      section.insertAdjacentHTML('beforeend', createTable(headers, rows));
    })
    .catch(e => {
      noData(element, e.message);
    });
}