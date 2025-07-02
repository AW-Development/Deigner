// popup/ui-helpers.js

/** Renders a "no data" message. */
export function noData(targetEl, message = '(none found)') {
  targetEl.insertAdjacentHTML('beforeend', `<p class="no-data-message"><em>${message}</em></p>`);
}

/** Creates a new section with a title and an optional export button. */
export function createSection(title, targetEl, options = {}) {
  const sectionEl = document.createElement('section');
  const titleEl = document.createElement('h2');
  titleEl.textContent = title;

  if (options.dataToExport) {
    const exportButtonTemplate = document.getElementById('exportButton');
    if (exportButtonTemplate) {
      const button = exportButtonTemplate.content.cloneNode(true).firstElementChild;
      button.addEventListener('click', () => downloadJson(options.dataToExport, `${options.exportFilename || title}.json`));
      titleEl.appendChild(button);
    }
  }
  
  sectionEl.appendChild(titleEl);
  targetEl.appendChild(sectionEl);
  return sectionEl; // Return the section element for appending content
}

/** Generates and returns an HTML table string. */
export function createTable(head, rows) {
  const h = head.map(x => `<th>${x}</th>`).join('');
  const r = rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
  return `<div class="table-wrapper"><table><thead><tr>${h}</tr></thead><tbody>${r}</tbody></table></div>`;
}

/** Parses query parameters from a URL. */
export function parseQueryParams(url) {
  try {
    const queryString = url.split('?')[1];
    return queryString ? new URLSearchParams(queryString) : new URLSearchParams();
  } catch (e) {
    console.error("Failed to parse URL query params:", url, e);
    return new URLSearchParams();
  }
}

/** Triggers a file download for JSON data. */
function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}