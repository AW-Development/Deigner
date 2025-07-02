import { createSection, createTable, noData } from '../ui-helpers.js';

export function renderNetworkTab(element, { network }) {
    const section = createSection('Ad-related Network Requests', element, {
        dataToExport: network,
        exportFilename: 'network_requests'
    });

    if (!network || network.length === 0) {
        noData(section, 'No ad-related network traffic captured for this tab.');
        return;
    }

    // Table + click-to-expand details
    const headers = ['Method', 'Type', 'URL', 'Status', 'Details'];
    const rows = network.map((req, idx) => {
        const urlDisplay = req.url.length > 80 ? req.url.substring(0, 77) + '…' : req.url;
        return [
            req.method,
            req.type || '',
            `<span title="${req.url}">${urlDisplay}</span>`,
            req.statusCode || (req.error ? 'ERR' : '—'),
            `<button class="show-details-btn" data-row="${idx}">Show</button>`
        ];
    });

    section.insertAdjacentHTML('beforeend', createTable(headers, rows));
    // Add hidden details rows (outside main table)
    network.forEach((req, idx) => {
        section.insertAdjacentHTML('beforeend',
            `<div class="network-details" id="network-details-${idx}" style="display:none;margin:6px 0;padding:8px;border:1px solid #ccc;font-size:0.95em;">
                <strong>Full URL:</strong> <a href="${req.url}" target="_blank">${req.url}</a><br>
                <strong>Request Headers:</strong> <pre>${(req.requestHeaders||[]).map(h => `${h.name}: ${h.value}`).join('\n')||'N/A'}</pre>
                <strong>Body:</strong> <pre>${req.requestBody ? JSON.stringify(req.requestBody, null, 2) : 'N/A'}</pre>
                <strong>Response Headers:</strong> <pre>${(req.responseHeaders||[]).map(h => `${h.name}: ${h.value}`).join('\n')||'N/A'}</pre>
                <strong>Error:</strong> ${req.error||'None'}
            </div>`);
    });
    // Button handlers
    section.querySelectorAll('.show-details-btn').forEach(btn => {
        btn.onclick = e => {
            const idx = btn.dataset.row;
            const d = section.querySelector(`#network-details-${idx}`);
            if (d.style.display === 'none') {
                d.style.display = '';
                btn.textContent = 'Hide';
            } else {
                d.style.display = 'none';
                btn.textContent = 'Show';
            }
        };
    });
}