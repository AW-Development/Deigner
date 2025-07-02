import { createSection, createTable, noData } from '../ui-helpers.js';

export function renderIdsTab(element, { page, network }) {
    const section = createSection('Detected IDs and Local Storage Data', element);

    let hasData = false;

    // Prebid eIDs (from page)
    const eids = page?.pbjs?.userIds || [];
    if (eids.length) {
        hasData = true;
        section.insertAdjacentHTML('beforeend', `<h3>Prebid.js User IDs (eIDs)</h3>`);
        section.insertAdjacentHTML('beforeend', createTable(
            ['Source', 'ID', 'Ext. Type', 'Ext. Data'],
            eids.map(x => [
                x.source,
                x.id,
                x.ext && x.ext.type ? x.ext.type : '',
                x.ext && x.ext.data ? JSON.stringify(x.ext.data) : ''
            ])
        ));
    }

    // Known user ID patterns from network
    const idMap = new Map();
    const idPatterns = {
        "LiveRamp": /idl: '([^']+)'/,
        "ID5": /"id5id":\{"universal_uid":"([^"]+)"\}/,
        "TradeDesk": /"tdid":"([^"]+)"/,
    };
    if (network && network.length) {
        network.forEach(req => {
            try {
                const url = decodeURIComponent(req.url);
                for (const [vendor, pattern] of Object.entries(idPatterns)) {
                    const match = url.match(pattern);
                    if (match && match[1]) {
                        idMap.set(vendor, match[1]);
                    }
                }
            } catch (e) {}
        });
    }
    if (idMap.size > 0) {
        hasData = true;
        section.insertAdjacentHTML('beforeend', `<h3>User IDs Found in Network</h3>`);
        section.insertAdjacentHTML('beforeend', createTable(['Vendor', 'ID'], Array.from(idMap.entries())));
    }

    // Local Storage
    const localStorageData = page?.storage?.localStorage || {};
    if (Object.keys(localStorageData).length) {
        hasData = true;
        section.insertAdjacentHTML('beforeend', `<h3>Local Storage</h3>`);
        section.insertAdjacentHTML('beforeend', createTable(['Key', 'Value'],
            Object.entries(localStorageData).map(([k, v]) => [k, v.length > 120 ? v.substring(0, 120) + '…' : v])
        ));
    }

    // Session Storage
    const sessionStorageData = page?.storage?.sessionStorage || {};
    if (Object.keys(sessionStorageData).length) {
        hasData = true;
        section.insertAdjacentHTML('beforeend', `<h3>Session Storage</h3>`);
        section.insertAdjacentHTML('beforeend', createTable(['Key', 'Value'],
            Object.entries(sessionStorageData).map(([k, v]) => [k, v.length > 120 ? v.substring(0, 120) + '…' : v])
        ));
    }

    if (!hasData) {
        noData(section, 'No IDs or storage data found in page or network.');
    }
}