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
| Add speaker | Click "Add Speaker" button below lanes |
| Remove empty speaker | Hover over label, click X |
| Merge speakers | Drag speaker label onto another speaker |
| Undo/Redo | Ctrl+Z / Ctrl+Shift+Z (up to 50 steps) |

### Playback Controls

| Action | How |
|--------|-----|
| Play/Pause | Click play button or press Space |
| Seek | Click anywhere on timeline |
| Skip 5 seconds | Left/Right arrow keys |
| Change speed | Use speed dropdown (0.25x - 2x) |
| Zoom | Use slider or +/- buttons |
| Toggle theme | Use theme toggle (Light/Dark/System) |
| Show shortcuts | Click ? button in header |

### Help

A shortcuts reference modal is available via the **?** button in the header. On first visit, it appears automatically to help new users get started.

### Duration Mismatch Warning

When loading an RTTM file, the editor checks if it matches the audio duration. A warning modal appears if:
- RTTM segments extend beyond the audio duration
- The audio is significantly longer than the RTTM coverage (>10% or >5 seconds)

The modal shows both file details and lets you choose to continue or cancel.

### Auto-Save

Your edits are automatically saved in the browser. When you reload the same audio file, your previous segments, speakers, and undo history are restored. The editor remembers the last 10 audio files.

### Cache Management

Click the **gear icon** in the header to open Settings and manage cached audio data:
- View all cached audio files with segment counts and last edit time
- Delete individual cache entries
- Clear all cached data

The current audio file is highlighted with a "Current" badge.

### Theme

The editor supports Light, Dark, and System (follows OS preference) themes. Your preference is saved in the browser.

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
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (used in CI) |
| `npm run test:coverage` | Run tests with coverage report |

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
│   ├── Header.tsx         # File controls, undo/redo, transport, zoom, theme, settings
│   ├── EditorWorkspace.tsx # Main layout, scroll sync
│   ├── WaveformCanvas.tsx  # wavesurfer.js wrapper
│   ├── TimelineContainer.tsx
│   ├── TimeRuler.tsx       # Adaptive tick intervals
│   ├── SpeakerLane.tsx     # Lane with label + segments
│   ├── SegmentBlock.tsx    # Individual segment
│   ├── GhostSegment.tsx    # Preview during drag
│   ├── Playhead.tsx
│   ├── DragGuideLine.tsx
│   ├── ShortcutsModal.tsx  # Help modal with keyboard shortcuts
│   ├── SettingsModal.tsx   # Cache management UI
│   ├── ConfirmMergeModal.tsx # Speaker merge confirmation
│   ├── ConfirmDeleteModal.tsx # Delete confirmation dialog
│   ├── RTTMMismatchModal.tsx  # RTTM duration mismatch warning
│   ├── Toast.tsx           # Toast notifications
│   ├── ThemeToggle.tsx     # Light/Dark/System theme switcher
│   ├── EmptyState.tsx      # Welcome screen when no audio
│   └── SegmentHint.tsx     # Hint overlay when no segments
├── store/
│   └── editorStore.ts   # Zustand state (single source of truth)
├── hooks/
│   ├── useDragHandlers.ts    # Document-level drag events
│   ├── useSpeakerMerge.ts    # Speaker merge drag-and-drop logic
│   ├── useStatePersistence.ts # localStorage save/restore
│   ├── useTheme.ts           # Theme management + system detection
│   └── useToast.ts           # Toast notification state
├── utils/
│   ├── rttmParser.ts    # RTTM parse/serialize
│   ├── rttmMismatch.ts  # RTTM duration mismatch detection
│   ├── stateStorage.ts  # Versioned LRU localStorage manager
│   ├── audioHash.ts     # SHA-256 file hashing
│   ├── colors.ts        # Speaker color assignment
│   ├── firstVisit.ts    # First-visit detection for help modal
│   ├── formatTime.ts    # Relative time formatting
│   └── themeStorage.ts  # Theme preference storage
├── types/
│   ├── index.ts         # TypeScript interfaces
│   └── global.d.ts      # Global type declarations (window.__wavesurferControls)
├── test/
│   └── setup.ts         # Test setup (mocks, globals)
├── App.tsx              # Root component + keyboard shortcuts
├── main.tsx             # Entry point
└── index.css            # Tailwind + dark mode CSS variables
```

### Key Architecture Decisions

**Zoom synchronization**: The `pixelsPerSecond` value in Zustand is the single source of truth. Both wavesurfer.js and CSS segment positioning use this value, ensuring perfect alignment.

**Global playback control**: `WaveformCanvas` exposes `window.__wavesurferControls` for cross-component access to playback methods without prop drilling.

**Drag operations**: `DragState` in the store tracks active drags. `useDragHandlers` attaches document-level listeners only while dragging. Real-time preview updates during drag, commit on mouseup.

**State persistence**: Audio files are identified by SHA-256 hash. Segments, manual speakers, and undo history auto-save to localStorage with LRU eviction (max 10 files).

**Undo/Redo**: State snapshot pattern. Each modifying action pushes current state to history stack before applying changes. Max 50 entries per stack.

**Dark theme**: Class-based dark mode via Tailwind's `dark:` variant. Theme preference stored in localStorage. WaveformCanvas updates wavesurfer.js colors via MutationObserver when `.dark` class changes on `<html>`.

### Testing

The project uses Vitest with React Testing Library. Tests are located alongside source files with `.test.ts` or `.test.tsx` extensions.

```bash
npm run test          # Watch mode for development
npm run test:run      # Single run (CI)
npm run test:coverage # Coverage report
```

Test suites cover:
- RTTM parsing/serialization (`src/utils/rttmParser.test.ts`)
- RTTM mismatch detection (`src/utils/rttmMismatch.test.ts`)
- Zustand store actions (`src/store/editorStore.test.ts`)
- State persistence (`src/utils/stateStorage.test.ts`)
- Speaker colors (`src/utils/colors.test.ts`)
- Time formatting (`src/utils/formatTime.test.ts`)
- First-visit detection (`src/utils/firstVisit.test.ts`)

Tests run automatically in CI before deployment.

### Dependencies

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `zustand` | State management (with `subscribeWithSelector` middleware) |
| `wavesurfer.js` | Audio waveform rendering |
| `tailwindcss` | Utility-first CSS (v4, with dark mode) |
| `lucide-react` | Icons |
| `vite` | Build tool |
| `typescript` | Type safety |
| `vitest` | Testing framework |
| `@testing-library/react` | React component testing utilities |

### Browser Support

Modern browsers with:
- Web Audio API
- Web Crypto API (for SHA-256 hashing)
- ES2020+ JavaScript

Tested on Chrome 120+, Firefox 120+, Safari 17+, Edge 120+.

**Mobile**: Responsive design adapts the header for smaller screens. On mobile, some controls (zoom, speed, undo/redo) are hidden to fit the viewport. Core functionality (import, playback, export) remains accessible. All drag operations (segment resize, relabel, speaker merge, label width) support touch events.
