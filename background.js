// background.js
import { initRequestHandlers, getDataForTab, clearDataForTab } from './background/request-handler.js';

// Initialize the network request listeners when the service worker starts
initRequestHandlers();

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getNetworkAdData") {
    const tabId = message.tabId;
    const networkData = getDataForTab(tabId);
    sendResponse(networkData);
    return true; // Indicate that we will send a response asynchronously
    }
  if (message.action === "getAdData") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            sendResponse({ error: "No active tab found" });
            return;
        }
        const tabId = tabs[0].id;
        // 1. Get network data we've already captured
        const networkData = getDataForTab(tabId);

        // 2. Execute a script on the page to get page-level objects
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => ({
                prebid: window.pbjs,
                tam: window.apstag,
                targeting: window.googletag?.pubads()?.getTargetingKeys(),
                sincera: window.sincera,
            }),
        }, (injectionResults) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                // Still send network data even if script injection fails
                sendResponse({ network: networkData, page: {} }); 
                return;
            }
            const pageData = injectionResults[0]?.result || {};
            // 3. Send a combined response back to the popup
            sendResponse({ network: networkData, page: pageData });
        });
    });
    // Return true to indicate you wish to send a response asynchronously
    return true;
  } 
  
  if (message.action === "clearAdData") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            clearDataForTab(tabs[0].id);
        }
        sendResponse({ status: "cleared" });
    });
    return true;
  }
});