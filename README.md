# Canvas Plus 

A  Chrome extension that enhances Canvas LMS with priority filtering, timelines, and in built UI. 
## Features

### Most Urgent Widget

- Highlights assignments due within **48 hours**
- Card-based layout with course information
- Click to open assignments directly

### Interactive Timeline

- Horizontal scrollable timeline from soonest to furthest
- Proportional positioning based on due dates
- Color-coded priority indicators

### Hybrid Authentication

- Automatic session-based authentication
- Optional API token fallback
- Secure token management in settings

## Installation

1. **Clone or download** this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `canvas-helper` directory

## Usage

### First Time Setup

1. Navigate to any Canvas LMS page (e.g., `*.instructure.com`)
2. The extension will automatically detect Canvas and load your data
3. Look for the **Canvas Plus** overlay in the top-right corner

### Optional: API Token Setup

For enhanced reliability, you can add a Canvas API token:

1. **Right-click** the extension icon → **Options**
2. Go to Canvas: **Account → Settings → New Access Token**
3. Copy the token and paste it in Canvas Plus settings
4. Click **Test Connection** to verify

### Settings

Access settings via: **Right-click extension icon → Options**

- API token management
- Enable/disable overlay
- Timeline range (7/14/30 days)
- Clear cache and refresh data

## Architecture

- **CanvasAPIService** - API interaction with hybrid auth
- **StorageService** - Cache management with TTL
- **StateManager** - Centralized state with observer pattern

## Development

### File Structure

```
canvas-helper/
├── scripts/
│   ├── services/          # API, Storage, State management
│   ├── components/        # UI components
│   └── content.js         # Main content script
├── styles/
│   └── material-design.css
├── settings/              # Settings page
├── popup/                 # Extension popup (preserved)
└── manifest.json
```

### Documentation

- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Technical roadmap

## Browser Support

- ✅ Chrome 
- ✅ Edge 
- ❌ Firefox 

