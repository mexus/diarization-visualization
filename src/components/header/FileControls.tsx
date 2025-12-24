import { useRef, useState } from 'react';
import { Upload, FileText, Download } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { parseRTTM, serializeRTTM } from '../../utils/rttmParser';
import { getRTTMCoverage, checkRTTMMismatch } from '../../utils/rttmMismatch';
import { RTTMMismatchModal } from '../modals/RTTMMismatchModal';
import type { Segment } from '../../types';
import type { RTTMCoverage, MismatchInfo } from '../../utils/rttmMismatch';

interface FileControlsProps {
  onToast: (type: 'success' | 'warning' | 'error', message: string) => void;
}

export function FileControls({ onToast }: FileControlsProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const rttmInputRef = useRef<HTMLInputElement>(null);
  const [pendingRTTM, setPendingRTTM] = useState<{
    file: File;
    segments: Segment[];
    coverage: RTTMCoverage;
    mismatchInfo: MismatchInfo;
  } | null>(null);

  const segments = useEditorStore((s) => s.segments);
  const duration = useEditorStore((s) => s.duration);
  const audioFile = useEditorStore((s) => s.audioFile);
  const setAudioFile = useEditorStore((s) => s.setAudioFile);
  const setSegments = useEditorStore((s) => s.setSegments);
  const setLoading = useEditorStore((s) => s.setLoading);

  const handleAudioImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleRTTMImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading('Loading RTTM file...');
        const text = await file.text();
        const parsedSegments = parseRTTM(text);
        if (parsedSegments.length === 0) {
          onToast('warning', 'No valid segments found in RTTM file');
        } else {
          const coverage = getRTTMCoverage(parsedSegments);
          const mismatchInfo = checkRTTMMismatch(coverage, duration);

          if (mismatchInfo && audioFile && duration > 0) {
            setPendingRTTM({ file, segments: parsedSegments, coverage, mismatchInfo });
          } else {
            setSegments(parsedSegments);
            onToast('success', `Loaded ${parsedSegments.length} segments`);
          }
        }
      } catch (error) {
        onToast('error', 'Failed to read RTTM file');
        console.error('RTTM import error:', error);
      } finally {
        setLoading(null);
      }
    }
    e.target.value = '';
  };

  const handleMismatchConfirm = () => {
    if (pendingRTTM) {
      setSegments(pendingRTTM.segments);
      onToast('success', `Loaded ${pendingRTTM.segments.length} segments`);
      setPendingRTTM(null);
    }
  };

  const handleMismatchCancel = () => {
    setPendingRTTM(null);
  };

  const handleRTTMExport = () => {
    if (segments.length === 0) return;

    const rttmText = serializeRTTM(segments);
    const blob = new Blob([rttmText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'diarization.rttm';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleAudioImport}
        />
        <button
          onClick={() => audioInputRef.current?.click()}
          className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md
            hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1"
          title="Import Audio"
          aria-label="Import audio file"
        >
          <Upload size={16} />
          <span className="hidden sm:inline">Audio</span>
        </button>

        <input
          ref={rttmInputRef}
          type="file"
          accept=".rttm"
          className="hidden"
          onChange={handleRTTMImport}
        />
        <button
          onClick={() => rttmInputRef.current?.click()}
          className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md
            hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition-colors
            focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:ring-offset-1 dark:focus:ring-offset-gray-900"
          title="Import RTTM"
          aria-label="Import RTTM diarization file"
        >
          <FileText size={16} />
          <span className="hidden sm:inline">RTTM</span>
        </button>

        <button
          onClick={handleRTTMExport}
          disabled={segments.length === 0}
          className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-sm bg-green-500 text-white rounded-md
            hover:bg-green-600 active:bg-green-700 transition-colors shadow-sm
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-1"
          title="Export RTTM"
          aria-label="Export RTTM diarization file"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {pendingRTTM && audioFile && (
        <RTTMMismatchModal
          isOpen={true}
          audioFileName={audioFile.name}
          audioDuration={duration}
          rttmFileName={pendingRTTM.file.name}
          segmentCount={pendingRTTM.segments.length}
          rttmCoverage={pendingRTTM.coverage}
          mismatchInfo={pendingRTTM.mismatchInfo}
          onConfirm={handleMismatchConfirm}
          onCancel={handleMismatchCancel}
        />
      )}
    </>
  );
}
