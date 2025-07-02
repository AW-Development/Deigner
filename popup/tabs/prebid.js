import { createSection, createTable, noData } from '../ui-helpers.js';

export function renderPrebidTab(element, { page }) {
    const prebid = page?.pbjs;
    element.innerHTML = '';

    // --- Helper: Should we show advanced? ---
    let advancedMode = false;
    try {
        // Prefer sync storage if available, else fallback to localStorage
        if (window.chrome && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get(['advancedMode'], result => {
                advancedMode = !!result.advancedMode;
                renderAll();
            });
            return; // Render asynchronously after settings load
        } else {
            advancedMode = localStorage.getItem('advancedMode') === 'true';
        }
    } catch {
        advancedMode = false;
    }

    renderAll();

    function renderAll() {
        element.innerHTML = '';
        if (!prebid || !prebid.ok) {
            noData(element, `Prebid.js: ${prebid ? prebid.reason : 'No data received.'}`);
            return;
        }

        // --- 1. All Bid Responses ---
        const responses = prebid.bidResponses || {};
        const responsesSection = createSection('Prebid.js All Bid Responses', element, { dataToExport: responses, exportFilename: 'prebid_responses' });
        const respCodes = Object.keys(responses);
        if (respCodes.length) {
            respCodes.forEach(c => {
                responsesSection.insertAdjacentHTML('beforeend', `<details><summary>${c} (${responses[c].bids.length} bids)</summary>${
                    createTable(['Bidder', 'CPM', 'Cur.', 'Status', 'T(ms)', 'Size', 'Creative'],
                    responses[c].bids.map(b => [b.bidder, b.cpm ? b.cpm.toFixed(4) : 'N/A', b.currency, b.statusMessage, b.timeToRespond, b.size, b.creativeId]))
                }</details>`);
            });
        } else {
            noData(responsesSection);
        }

        // --- 2. Bid Statistics ---
        const stats = prebid.stats || {};
        const statsSection = createSection('Prebid.js Bid Statistics', element, { dataToExport: stats, exportFilename: 'prebid_stats' });
        if (Object.keys(stats).length) {
            statsSection.insertAdjacentHTML('beforeend', '<h3>Bid Status Distribution</h3>');
            if (Object.keys(stats.bidStatusCounts).length > 0) {
                statsSection.insertAdjacentHTML('beforeend', createTable(
                    ['Status', 'Count'],
                    Object.entries(stats.bidStatusCounts)
                ));
            } else { noData(statsSection); }

            statsSection.insertAdjacentHTML('beforeend', '<h3>Timed Out Bidders</h3>');
            if (stats.timedOutBidders && stats.timedOutBidders.length > 0) {
                statsSection.insertAdjacentHTML('beforeend', `<p>${stats.timedOutBidders.join(', ')}</p>`);
            } else { noData(statsSection); }
        } else {
            noData(statsSection);
        }

        // --- 3. Winning Bids ---
        const winning = prebid.winningBids || [];
        const winningSection = createSection('Prebid.js Winning Bids', element, { dataToExport: winning, exportFilename: 'prebid_winning' });
        if (winning.length) {
            winningSection.insertAdjacentHTML('beforeend', createTable(
                ['Unit', 'Bidder', 'CPM', 'Cur.', 'Size', 'Creative'],
                winning.map(x => [x.adUnitCode, x.bidder, x.cpm.toFixed(4), x.currency, x.size, x.creativeId])
            ));
        } else {
            noData(winningSection);
        }

        // --- 4. Ad Server Targeting ---
        const targeting = prebid.targeting || {};
        const targetingSection = createSection('Prebid.js Ad Server Targeting', element, { dataToExport: targeting, exportFilename: 'prebid_targeting' });
        const codes = Object.keys(targeting);
        if (codes.length) {
            codes.forEach(c => {
                targetingSection.insertAdjacentHTML('beforeend', `<details open><summary>${c}</summary>${
                    createTable(['Key', 'Val'], Object.entries(targeting[c]))
                }</details>`);
            });
        } else {
            noData(targetingSection);
        }

        // --- ADVANCED SECTIONS: 5-8, hidden unless advancedMode is on ---
        const advancedDiv = document.createElement('div');
        advancedDiv.id = 'prebid-advanced';
        advancedDiv.style.display = advancedMode ? '' : 'none';

        // 5. User IDs (eIDs)
        const userIds = prebid.userIds || [];
        const userIdsSection = createSection('Prebid.js User IDs (eIDs)', advancedDiv, { dataToExport: userIds, exportFilename: 'prebid_userids' });
        if (userIds.length) {
            userIdsSection.insertAdjacentHTML('beforeend', createTable(
                ['Source', 'ID', 'Ext. Type', 'Ext. Data'],
                userIds.map(x => [
                    x.source,
                    x.id,
                    x.ext && x.ext.type ? x.ext.type : '',
                    x.ext && x.ext.data ? JSON.stringify(x.ext.data) : ''
                ])
            ));
        } else {
            noData(userIdsSection);
        }

        // 6. Configuration
        const config = prebid.config || {};
        const configSection = createSection('Prebid.js Configuration', advancedDiv, { dataToExport: config, exportFilename: 'prebid_config' });
        if (Object.keys(config).length) {
            const prim = Object.entries(config).filter(([k, v]) => typeof v !== 'object');
            if (prim.length) configSection.insertAdjacentHTML('beforeend', createTable(['Key', 'Val'], prim));
            Object.entries(config).filter(([k, v]) => typeof v === 'object')
                .forEach(([k, v]) => configSection.insertAdjacentHTML('beforeend', `<details><summary>${k}</summary><pre>${JSON.stringify(v, null, 2)}</pre></details>`));
        } else {
            noData(configSection);
        }

        // 7. User Consent
        const consent = prebid.userConsent || {};
        const consentSection = createSection('Prebid.js User Consent (GDPR/CCPA)', advancedDiv, { dataToExport: consent, exportFilename: 'prebid_consent' });
        if (Object.keys(consent).length) {
            consentSection.insertAdjacentHTML('beforeend', '<pre>' + JSON.stringify(consent, null, 2) + '</pre>');
        } else {
            noData(consentSection);
        }

        // 8. Ad Units (moved to advanced)
        const adUnits = prebid.adUnits || [];
        const adUnitsSection = createSection('Prebid.js Ad Units', advancedDiv, { dataToExport: adUnits, exportFilename: 'prebid_adunits' });
        if (adUnits.length) {
            const headers = ['Code', 'Media Types', 'Bidders', 'Sizes'];
            const rows = adUnits.map(x => [
                x.code,
                Object.keys(x.mediaTypes || {}).join(', '),
                x.bids.map(b => b.bidder).join(', '),
                [...new Set(
                  (x.sizes || []).map(z => z.join('×'))
                    .concat(...Object.values(x.mediaTypes || {}).flatMap(mt => mt.sizes || []).map(z => z.join('×')))
                )].join(' , ')
            ]);
            adUnitsSection.insertAdjacentHTML('beforeend', createTable(headers, rows));
        } else {
            noData(adUnitsSection, 'No ad units configured.');
        }

        element.appendChild(advancedDiv);

        // --- Live toggle (respond to advanced mode changes) ---
        if (window.chrome && chrome.storage && chrome.storage.sync) {
            document.removeEventListener('advancedModeToggle', toggleHandler);
            document.addEventListener('advancedModeToggle', toggleHandler);
        }

        function toggleHandler() {
            chrome.storage.sync.get(['advancedMode'], (result) => {
                advancedDiv.style.display = !!result.advancedMode ? '' : 'none';
            });
        }
    }
}