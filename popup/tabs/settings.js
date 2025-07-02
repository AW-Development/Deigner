import { createSection } from '../ui-helpers.js';

// --- Helper functions for UI tweaks ---
const setAdvanced = (enabled) => document.body.classList.toggle('advanced-enabled', !!enabled);
const applyTheme = (theme) => document.body.classList.toggle('dark-mode', theme === 'dark');

export function renderSettingsTab(element) {
    element.innerHTML = '';

    // --- Sincera API Key Section ---
    const sinceraSection = createSection('API Keys', element);
    sinceraSection.innerHTML += `
        <label for="opensinceraApiKey">OpenSincera API Key:</label>
        <input type="text" id="opensinceraApiKey" placeholder="Paste your API key here..." style="width:100%">
        <button id="saveSinceraKey" class="control-button primary" style="margin-top:8px">Save</button>
    `;
    // Load and save API key
    chrome.storage.sync.get(['opensinceraApiKey'], ({ opensinceraApiKey }) => {
        sinceraSection.querySelector('#opensinceraApiKey').value = opensinceraApiKey || '';
    });
    sinceraSection.querySelector('#saveSinceraKey').onclick = () => {
        const val = sinceraSection.querySelector('#opensinceraApiKey').value.trim();
        chrome.storage.sync.set({ opensinceraApiKey: val }, () => {
            alert('API key saved!');
        });
    };

    // --- Display Settings Section ---
    const displaySection = createSection('Display Settings', element);

    // Dark Mode toggle
    const darkLabel = document.createElement('label');
    darkLabel.style.display = 'block';
    darkLabel.style.marginTop = '12px';
    const darkInput = document.createElement('input');
    darkInput.type = 'checkbox';
    darkInput.style.marginRight = '8px';
    darkLabel.appendChild(darkInput);
    darkLabel.appendChild(document.createTextNode('Dark Mode'));
    displaySection.appendChild(darkLabel);

    // Advanced Mode toggle
    const advLabel = document.createElement('label');
    advLabel.style.display = 'block';
    advLabel.style.marginTop = '12px';
    const advInput = document.createElement('input');
    advInput.type = 'checkbox';
    advInput.style.marginRight = '8px';
    advLabel.appendChild(advInput);
    advLabel.appendChild(document.createTextNode('Show Advanced Prebid.js details'));
    displaySection.appendChild(advLabel);

    // --- Load saved settings and apply them ---
    chrome.storage.sync.get(['theme', 'advancedMode'], (settings) => {
        // Dark Mode
        if (settings.theme === 'dark') {
            darkInput.checked = true;
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
        // Advanced Mode
        if (settings.advancedMode) {
            advInput.checked = true;
            setAdvanced(true);
        } else {
            setAdvanced(false);
        }
    });

    // --- Dark Mode change ---
    darkInput.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        applyTheme(newTheme);
        chrome.storage.sync.set({ theme: newTheme });
    });

    // --- Advanced Mode change ---
    advInput.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        setAdvanced(isEnabled);
        chrome.storage.sync.set({ advancedMode: isEnabled }, () => {
            // Notify other tabs (e.g. Prebid tab) to show/hide advanced content
            document.dispatchEvent(new CustomEvent('advancedModeToggle'));
        });
    });

    // --- [OPTIONAL] Additional settings UI can go here ---
}