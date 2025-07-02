import { createSection, createTable, noData } from '../ui-helpers.js';

// Show both page targeting keys and any found in network
export function renderTargetingTab(element, { page, network }) {
    const section = createSection('User Targeting Transparency', element, {
        dataToExport: { page, network },
        exportFilename: 'targeting_data'
    });

    // Prebid targeting (from page)
    const pbjsTargeting = page?.pbjs?.targeting || {};
    if (Object.keys(pbjsTargeting).length) {
        section.insertAdjacentHTML('beforeend', `<h3>Prebid.js Ad Server Targeting</h3>`);
        Object.entries(pbjsTargeting).forEach(([adUnit, keys]) => {
            section.insertAdjacentHTML('beforeend', `<details open><summary>${adUnit}</summary>${
                createTable(['Key', 'Value'], Object.entries(keys))
            }</details>`);
        });
    } else {
        section.insertAdjacentHTML('beforeend', '<h4>No Prebid.js ad server targeting found.</h4>');
    }

    // GAM keys (from page)
    const gamKeys = page?.targeting || [];
    if (gamKeys.length) {
        section.insertAdjacentHTML('beforeend', `<h3>Google Ad Manager Targeting Keys</h3>`);
        section.insertAdjacentHTML('beforeend', createTable(['Key'], gamKeys.map(k => [k])));
    }

    // Targeting found in network requests
    let foundNetwork = false;
    if (network && network.length) {
        section.insertAdjacentHTML('beforeend', `<h3>Targeting in Network Requests</h3>`);
        network.forEach(req => {
            const params = new URLSearchParams(req.url.split('?')[1] || '');
            let found = false;
            const keys = [];
            params.forEach((v, k) => {
                if (k.startsWith('cust_') || k.startsWith('hb_') || k.startsWith('amzn_') || k === 'gdpr' || k === 'gdpr_consent' || k === 'npa') {
                    found = true;
                    keys.push([k, v]);
                }
            });
            if (found) {
                foundNetwork = true;
                section.insertAdjacentHTML('beforeend', `<details><summary>${req.url.substring(0, 90)}...</summary>${createTable(['Key', 'Value'], keys)}</details>`);
            }
        });
    }
    if (!Object.keys(pbjsTargeting).length && !gamKeys.length && !foundNetwork) {
        noData(section, 'No targeting found in page or network requests.');
    }
}