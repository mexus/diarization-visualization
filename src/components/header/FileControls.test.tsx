import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileControls } from './FileControls';
import { useEditorStore } from '../../store/editorStore';

// Store original URL methods
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

describe('FileControls', () => {
  const mockOnToast = vi.fn();
  const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
  const mockRevokeObjectURL = vi.fn();

  beforeEach(() => {
    // Mock URL methods
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;

    // Reset store to initial state
    useEditorStore.setState({
      segments: [],
      speakers: [],
      manualSpeakers: [],
      duration: 60,
      audioFile: null,
      loadingMessage: null,
    });
    mockOnToast.mockClear();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    // Restore URL methods
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  describe('Audio import', () => {
    it('should render audio import button', () => {
      render(<FileControls onToast={mockOnToast} />);

      const button = screen.getByRole('button', { name: /import audio/i });
      expect(button).toBeInTheDocument();
    });

    it('should set audio file when file is selected', async () => {
      render(<FileControls onToast={mockOnToast} />);

      const input = document.querySelector('input[accept="audio/*"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();

      const testFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });
      fireEvent.change(input, { target: { files: [testFile] } });

      expect(useEditorStore.getState().audioFile).toBe(testFile);
    });
  });

  describe('RTTM import', () => {
    it('should render RTTM import button', () => {
      render(<FileControls onToast={mockOnToast} />);

      const button = screen.getByRole('button', { name: /import rttm/i });
      expect(button).toBeInTheDocument();
    });

    it('should have a hidden file input for RTTM', () => {
      render(<FileControls onToast={mockOnToast} />);

      const input = document.querySelector('input[accept=".rttm"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('hidden');
      expect(input.type).toBe('file');
    });
  });

  describe('RTTM export', () => {
    it('should render disabled export button when no segments', () => {
      render(<FileControls onToast={mockOnToast} />);

      const button = screen.getByRole('button', { name: /export rttm/i });
      expect(button).toBeDisabled();
    });

    it('should render enabled export button when segments exist', () => {
      useEditorStore.setState({
        segments: [{ id: '1', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 }],
      });

      render(<FileControls onToast={mockOnToast} />);

      const button = screen.getByRole('button', { name: /export rttm/i });
      expect(button).not.toBeDisabled();
    });

    it('should create and download RTTM file when export button is clicked', async () => {
      const user = userEvent.setup();

      // Capture the anchor element click
      let downloadFileName = '';
      const originalAppendChild = document.body.appendChild.bind(document.body);
      const originalRemoveChild = document.body.removeChild.bind(document.body);

      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        if (node instanceof HTMLAnchorElement) {
          downloadFileName = node.download;
          // Don't actually click, just record
          return node;
        }
        return originalAppendChild(node);
      });
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => {
        if (node instanceof HTMLAnchorElement) {
          return node;
        }
        return originalRemoveChild(node);
      });

      useEditorStore.setState({
        segments: [
          { id: '1', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 },
          { id: '2', speakerId: 'SPEAKER_01', startTime: 2, duration: 1.5 },
        ],
      });

      render(<FileControls onToast={mockOnToast} />);

      const button = screen.getByRole('button', { name: /export rttm/i });
      await user.click(button);

      // Should have created a blob URL
      expect(mockCreateObjectURL).toHaveBeenCalled();

      // Should have set download filename
      expect(downloadFileName).toBe('diarization.rttm');

      // Should have revoked the blob URL
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      // Restore mocks
      vi.restoreAllMocks();
    });
  });

});
