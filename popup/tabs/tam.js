import { createSection, createTable, noData } from '../ui-helpers.js';

export function renderTamTab(element, { network }) {
    const section = createSection('Amazon TAM Network Activity', element, {
        dataToExport: network,
        exportFilename: 'tam_network'
    });

    // Find TAM bid requests
    const tamBidRequests = [];
    const tamAdEvents = [];

    if (network && network.length) {
        network.forEach(req => {
            // TAM Bid Requests (dtb/bid)
            if (req.url.includes('amazon-adsystem.com/e/dtb/bid') && req.method === 'POST' && req.requestBody) {
                let slots = [];
                try {
                    const body = typeof req.requestBody === 'string' ? JSON.parse(req.requestBody) : req.requestBody;
                    slots = (body && body.slots && Array.isArray(body.slots)) ? body.slots : [];
                } catch {}
                slots.forEach(slot => {
                    tamBidRequests.push({
                        slotID: slot.slotID,
                        sizes: (slot.sizes || []).map(s => s.join('x')).join(', ')
                    });
                });
            }
            // Ad Events (served ads, creative IDs, etc)
            if (req.url.includes('aax.amazon-adsystem.com/') && req.url.includes('/x/ns/')) {
                // These URLs carry ad serving info (creative ID, size, slotID)
                try {
                    const params = new URLSearchParams(req.url.split('?')[1] || '');
                    tamAdEvents.push({
                        slotID: params.get('slotID') || 'N/A',
                        creativeId: params.get('crid') || 'N/A',
                        size: params.get('sz') || 'N/A',
                        url: req.url
                    });
                } catch {}
            }
        });
    }

    // Show Bid Requests
    section.insertAdjacentHTML('beforeend', `<h3>TAM Bid Requests (${tamBidRequests.length})</h3>`);
    if (tamBidRequests.length) {
        section.insertAdjacentHTML('beforeend', createTable(['Slot ID', 'Sizes'], tamBidRequests.map(x => [x.slotID, x.sizes])));
    } else {
        noData(section, 'No TAM bid requests found.');
    }

    // Show Ad Events
    section.insertAdjacentHTML('beforeend', `<h3>TAM Ad Events (${tamAdEvents.length})</h3>`);
    if (tamAdEvents.length) {
        section.insertAdjacentHTML('beforeend', createTable(['Slot ID', 'Creative ID', 'Size', 'URL'],
            tamAdEvents.map(x => [
                x.slotID,
                x.creativeId,
                x.size,
                `<a href="${x.url}" target="_blank">${x.url.substring(0, 60)}...</a>`
            ])));
    } else {
        noData(section, 'No TAM ad events found.');
    }
}