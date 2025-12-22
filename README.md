# Diarization Editor

A web-based tool for visualizing and correcting speaker diarization output. Provides a DAW-style interface where RTTM speaker segments align with audio waveforms in a swimlane layout.

## For Users

### Getting Started

1. Open the application in a modern browser (Chrome, Firefox, Edge, Safari)
2. Click **Audio** to load an audio file (WAV, MP3, OGG, etc.)
3. Click **RTTM** to load a diarization file in RTTM format
4. Edit segments as needed
5. Click **Export** to download the corrected RTTM file

### Editing Segments

| Action | How |
|--------|-----|
| Select segment | Click on it |
| Resize segment | Drag left/right edge handles |
| Move to another speaker | Drag segment body to different lane |
| Create new segment | Double-click empty area in a lane |
| Delete segment | Click X button or press Delete/Backspace |
| Rename speaker | Click speaker label in sidebar |

### Playback Controls

| Action | How |
|--------|-----|
| Play/Pause | Click play button or press Space |
| Seek | Click anywhere on timeline |
| Skip 5 seconds | Left/Right arrow keys |
| Change speed | Use speed dropdown (0.25x - 2x) |
| Zoom | Use slider or +/- buttons |
| Show shortcuts | Click ? button in header |

### Help

A shortcuts reference modal is available via the **?** button in the header. On first visit, it appears automatically to help new users get started.

### Auto-Save

Your edits are automatically saved in the browser. When you reload the same audio file, your previous segments are restored.

### RTTM Format

The editor imports and exports standard RTTM (Rich Transcription Time Marked) format:

```
SPEAKER audio 1 0.500 2.340 <NA> <NA> SPEAKER_00 <NA> <NA>
SPEAKER audio 1 3.100 1.200 <NA> <NA> SPEAKER_01 <NA> <NA>
```

Fields: `SPEAKER <file> <channel> <start_time> <duration> <NA> <NA> <speaker_id> <NA> <NA>`

---

## For Developers

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
git clone <repo-url>
cd diarization-visualization
npm install
npm run dev
```

Open http://localhost:5173

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR (port 5173) |
| `npm run build` | TypeScript check + production build to `dist/` |
| `npm run preview` | Serve production build locally (port 4173) |
| `npm run lint` | Run ESLint |

### Production Build

```bash
npm run build
```

Output is in `dist/`. This is a static SPA - serve it from any static file host (Nginx, Caddy, S3, Netlify, Vercel, GitHub Pages, etc).

Example Nginx config:

```nginx
server {
    listen 80;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx         # File controls, transport, zoom
│   ├── EditorWorkspace.tsx # Main layout, scroll sync
│   ├── WaveformCanvas.tsx  # wavesurfer.js wrapper
│   ├── TimelineContainer.tsx
│   ├── TimeRuler.tsx
│   ├── SpeakerLane.tsx     # Lane with label + segments
│   ├── SegmentBlock.tsx    # Individual segment
│   ├── GhostSegment.tsx    # Preview during drag
│   ├── Playhead.tsx
│   ├── DragGuideLine.tsx
│   └── ShortcutsModal.tsx  # Help modal with keyboard shortcuts
├── store/
│   └── editorStore.ts   # Zustand state (single source of truth)
├── hooks/
│   ├── useDragHandlers.ts    # Document-level drag events
│   └── useStatePersistence.ts # localStorage save/restore
├── utils/
│   ├── rttmParser.ts    # RTTM parse/serialize
│   ├── stateStorage.ts  # LRU localStorage manager
│   ├── audioHash.ts     # SHA-256 file hashing
│   ├── colors.ts        # Speaker color assignment
│   └── firstVisit.ts    # First-visit detection for help modal
├── types/
│   └── index.ts         # TypeScript interfaces
├── App.tsx              # Root component + keyboard shortcuts
├── main.tsx             # Entry point
└── index.css            # Tailwind imports
```

### Key Architecture Decisions

**Zoom synchronization**: The `pixelsPerSecond` value in Zustand is the single source of truth. Both wavesurfer.js and CSS segment positioning use this value, ensuring perfect alignment.

**Global playback control**: `WaveformCanvas` exposes `window.__wavesurferControls` for cross-component access to playback methods without prop drilling.

**Drag operations**: `DragState` in the store tracks active drags. `useDragHandlers` attaches document-level listeners only while dragging. Real-time preview updates during drag, commit on mouseup.

**State persistence**: Audio files are identified by SHA-256 hash. Segments auto-save to localStorage with LRU eviction (max 10 files).

### Dependencies

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `zustand` | State management |
| `wavesurfer.js` | Audio waveform rendering |
| `tailwindcss` | Utility-first CSS |
| `lucide-react` | Icons |
| `vite` | Build tool |
| `typescript` | Type safety |

### Browser Support

Modern browsers with:
- Web Audio API
- Web Crypto API (for SHA-256 hashing)
- ES2020+ JavaScript

Tested on Chrome 120+, Firefox 120+, Safari 17+, Edge 120+.
