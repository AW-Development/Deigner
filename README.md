# ArenaWins Ad Inspector "Deigner" — Market Transparency Chrome Extension

> **by [ArenaWins.com](https://arenawins.com)**
>
> _For questions, support, contributing, or inquiries, contact [Brayden Hord](mailto:brayden.hord@arenawins.com)_

---

## Overview

**ArenaWins Ad Inspector** is a professional Chrome extension built by the ArenaWins digital political advertising team to reveal the hidden world of programmatic and auction-based advertising on the modern web.

This tool empowers professionals, advocacy groups, journalists, and privacy-conscious individuals to understand what ad tech is running, who’s bidding, and how personal data is handled — with an interface and codebase designed for transparency, reliability, and extendibility.

---

## Features

- **Prebid.js Analysis**
  - Lists all bid responses and key bidders for each ad slot
  - Shows winning bids and user IDs (eIDs)
  - Provides a full Prebid.js configuration dump and debug log (Advanced)

- **Amazon TAM Support**
  - Surfaces TAM-related bid requests and responses (if present)

- **Network Inspector**
  - Reveals ad-related network traffic in real-time

- **User Targeting Inspector**
  - Exposes granular targeting data, audience IDs, and categories

- **Identity & Consent**
  - Surfaces eID user IDs and privacy consent (GDPR/CCPA) signals

- **OpenSincera**
  - Showcases TheTradeDesk's new [Opensincera](https://open.sincera.io/) service, [documentation on what it provides is here](https://partner.thetradedesk.com/v3/portal/opensincera/doc/OpenSinceraGetStarted). Giving insights like:
    - A site's avg ad refresh time
    - On Avg, How many ads are in view on any given page
    - How many unique kinds of placements are there on a given site (GPIDs)
    - What's the ID-rate, or how likely are users to be identified using the various identity spines that exist for that given site
    - more!

- **Advanced Mode**
  - Unlocks power-user features and deep-dive JSON exports

---

## Installation

1. **Clone or Download** this repository.
2. Go to `chrome://extensions/` in Google Chrome.
3. Enable "Developer mode".
4. Click "Load unpacked" and select the project folder.
5. Click the ArenaWins Ad Inspector icon to launch.

---

## Usage

- Click the extension icon while on any web page.
- Review all detected ad technology in the organized tabbed UI.
- Use Advanced Settings for full debug information, export features, and deep technical insights.
- For support, feature requests, or inquiries, email [Brayden Hord](mailto:brayden.hord@arenawins.com).

---

## Contributing

We welcome contributions from the community!  
Please open an issue or pull request with proposed changes or improvements.

---

## Credits

- **Developer:** [Brayden Hord](mailto:brayden.hord@arenawins.com), ArenaWins Digital
- Special thanks to the ArenaWins engineering and ops teams for feedback, QA, and real-world testing.

---

## License

MIT License.  
If you adapt or improve this code, please let us know — we’re building a better, more transparent web together.

