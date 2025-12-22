import { Upload, FileText, Music, MousePointer2 } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { useRef, useState, useCallback } from 'react';

export function EmptyState() {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const setAudioFile = useEditorStore((s) => s.setAudioFile);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('audio/')) {
        setAudioFile(file);
      }
    },
    [setAudioFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setAudioFile(file);
      }
    },
    [setAudioFile]
  );

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
      <div
        className={`max-w-lg w-full rounded-xl border-2 border-dashed
          transition-all duration-200 ease-out
          ${
            isDragOver
              ? 'border-blue-400 bg-blue-50 scale-[1.02]'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-8 text-center">
          {/* Icon */}
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4
            transition-colors duration-200
            ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}
          >
            <Music className={`w-8 h-8 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Diarization Editor
          </h2>

          {/* Subtitle */}
          <p className="text-gray-500 mb-6">
            Visualize and edit speaker diarization with a DAW-style interface
          </p>

          {/* Drop zone hint */}
          <p
            className={`text-sm mb-6 transition-colors duration-200
            ${isDragOver ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
          >
            {isDragOver ? 'Drop audio file here' : 'Drag and drop an audio file here, or'}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => audioInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5
                bg-blue-500 text-white rounded-lg font-medium
                hover:bg-blue-600 active:bg-blue-700
                transition-colors duration-150
                shadow-sm hover:shadow"
            >
              <Upload size={18} />
              Import Audio
            </button>
          </div>

          {/* Quick tips */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Quick Start</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="flex items-start gap-2 text-sm text-gray-500">
                <Upload size={16} className="mt-0.5 text-gray-400 shrink-0" />
                <span>Import audio file (.wav, .mp3, etc.)</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-500">
                <FileText size={16} className="mt-0.5 text-gray-400 shrink-0" />
                <span>Load RTTM diarization file</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-500">
                <MousePointer2 size={16} className="mt-0.5 text-gray-400 shrink-0" />
                <span>Click segments to edit</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-500">
                <Music size={16} className="mt-0.5 text-gray-400 shrink-0" />
                <span>Click waveform to seek</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
