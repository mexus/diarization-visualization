import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpeakerLane } from './SpeakerLane';
import { useEditorStore } from '../../store/editorStore';
import type { Segment } from '../../types';

// Mock the SegmentBlock to avoid testing its implementation details
vi.mock('./SegmentBlock', () => ({
  SegmentBlock: ({ segment }: { segment: Segment }) => (
    <div data-testid={`segment-${segment.id}`}>
      {segment.speakerId}: {segment.startTime}s
    </div>
  ),
}));

// Mock the GhostSegment
vi.mock('./GhostSegment', () => ({
  GhostSegment: ({ segment }: { segment: Segment }) => (
    <div data-testid="ghost-segment">{segment.speakerId}</div>
  ),
}));

// Mock the ConfirmMergeModal
vi.mock('../modals/ConfirmMergeModal', () => ({
  ConfirmMergeModal: ({
    isOpen,
    sourceId,
    targetId,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean;
    sourceId: string;
    targetId: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    isOpen ? (
      <div data-testid="merge-modal">
        <span>Merge {sourceId} into {targetId}</span>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

describe('SpeakerLane', () => {
  const mockSegments: Segment[] = [
    { id: 'seg-1', speakerId: 'SPEAKER_00', startTime: 0, duration: 2 },
    { id: 'seg-2', speakerId: 'SPEAKER_00', startTime: 5, duration: 1 },
    { id: 'seg-3', speakerId: 'SPEAKER_01', startTime: 3, duration: 2 },
  ];

  beforeEach(() => {
    useEditorStore.getState().reset();
    useEditorStore.setState({
      segments: mockSegments,
      duration: 60,
      pixelsPerSecond: 100,
      labelWidth: 120,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render speaker label', () => {
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      expect(screen.getByText('SPEAKER_00')).toBeInTheDocument();
    });

    it('should render only segments for this speaker', () => {
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      expect(screen.getByTestId('segment-seg-1')).toBeInTheDocument();
      expect(screen.getByTestId('segment-seg-2')).toBeInTheDocument();
      expect(screen.queryByTestId('segment-seg-3')).not.toBeInTheDocument();
    });

    it('should apply correct background color based on index', () => {
      const { container: container0 } = render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);
      const { container: container1 } = render(<SpeakerLane speakerId="SPEAKER_01" index={1} />);

      const lane0 = container0.firstChild as HTMLElement;
      const lane1 = container1.firstChild as HTMLElement;

      // Even index should have white background class
      expect(lane0.className).toContain('bg-white');
      // Odd index should have gray background class
      expect(lane1.className).toContain('bg-gray-50');
    });

    it('should have data-speaker-lane attribute', () => {
      const { container } = render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const lane = container.firstChild as HTMLElement;
      expect(lane.getAttribute('data-speaker-lane')).toBe('SPEAKER_00');
    });

    it('should calculate total width from duration and pixelsPerSecond', () => {
      const { container } = render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const lane = container.firstChild as HTMLElement;
      // totalWidth = duration * pixelsPerSecond + labelWidth = 60 * 100 + 120 = 6120
      expect(lane.style.width).toBe('6120px');
    });
  });

  describe('speaker rename', () => {
    it('should enter edit mode on label click', async () => {
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const label = screen.getByText('SPEAKER_00');
      fireEvent.click(label);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('SPEAKER_00');
    });

    it('should rename speaker on Enter', async () => {
      const user = userEvent.setup();
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const label = screen.getByText('SPEAKER_00');
      fireEvent.click(label);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'NEW_SPEAKER{Enter}');

      // Check store was updated
      const segments = useEditorStore.getState().segments;
      expect(segments.find((s) => s.id === 'seg-1')?.speakerId).toBe('NEW_SPEAKER');
    });

    it('should cancel edit on Escape', async () => {
      const user = userEvent.setup();
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const label = screen.getByText('SPEAKER_00');
      fireEvent.click(label);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'CHANGED');
      await user.keyboard('{Escape}');

      // Should show original name
      expect(screen.getByText('SPEAKER_00')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should save on blur', async () => {
      const user = userEvent.setup();
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const label = screen.getByText('SPEAKER_00');
      fireEvent.click(label);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'BLURRED_SPEAKER');
      fireEvent.blur(input);

      const segments = useEditorStore.getState().segments;
      expect(segments.find((s) => s.id === 'seg-1')?.speakerId).toBe('BLURRED_SPEAKER');
    });

    it('should not rename if name is empty', async () => {
      const user = userEvent.setup();
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      fireEvent.click(screen.getByText('SPEAKER_00'));

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.keyboard('{Enter}');

      // Original name should be preserved
      const segments = useEditorStore.getState().segments;
      expect(segments.find((s) => s.id === 'seg-1')?.speakerId).toBe('SPEAKER_00');
    });

    it('should not rename if name is unchanged', async () => {
      const pushHistorySpy = vi.spyOn(useEditorStore.getState(), 'renameSpeaker');
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      fireEvent.click(screen.getByText('SPEAKER_00'));

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      // renameSpeaker should not be called since name is unchanged
      expect(pushHistorySpy).not.toHaveBeenCalled();
    });
  });

  describe('remove speaker', () => {
    it('should show delete button on hover for empty speaker', () => {
      useEditorStore.setState({
        segments: [],
        manualSpeakers: ['EMPTY_SPEAKER'],
      });

      render(<SpeakerLane speakerId="EMPTY_SPEAKER" index={0} />);

      const label = screen.getByText('EMPTY_SPEAKER').closest('[data-speaker-label]');
      fireEvent.mouseEnter(label!);

      expect(screen.getByLabelText('Remove speaker EMPTY_SPEAKER')).toBeInTheDocument();
    });

    it('should not show delete button for speaker with segments', () => {
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const label = screen.getByText('SPEAKER_00').closest('[data-speaker-label]');
      fireEvent.mouseEnter(label!);

      expect(screen.queryByLabelText(/Remove speaker/)).not.toBeInTheDocument();
    });

    it('should remove speaker when delete button clicked', () => {
      useEditorStore.setState({
        segments: [],
        manualSpeakers: ['EMPTY_SPEAKER'],
      });

      render(<SpeakerLane speakerId="EMPTY_SPEAKER" index={0} />);

      const label = screen.getByText('EMPTY_SPEAKER').closest('[data-speaker-label]');
      fireEvent.mouseEnter(label!);

      fireEvent.click(screen.getByLabelText('Remove speaker EMPTY_SPEAKER'));

      expect(useEditorStore.getState().manualSpeakers).not.toContain('EMPTY_SPEAKER');
    });
  });

  describe('create segment (double-click)', () => {
    it('should create segment on double-click', () => {
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      // Find the segments container (the div after the label)
      const segmentsContainer = document.querySelector('[style*="width: 6000px"]');

      // Double-click at position 1000px from left (should be ~10 seconds)
      fireEvent.doubleClick(segmentsContainer!, {
        clientX: 1000,
      });

      const segments = useEditorStore.getState().segments;
      // Should have one more segment
      expect(segments.filter((s) => s.speakerId === 'SPEAKER_00')).toHaveLength(3);
    });
  });

  describe('relabel drag target', () => {
    it('should highlight when is relabel target', () => {
      useEditorStore.setState({
        dragState: {
          type: 'relabel',
          segmentId: 'seg-3',
          originalSegment: mockSegments[2],
          currentSpeakerId: 'SPEAKER_00',
        },
      });

      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      // Should have highlighted background
      const segmentsContainer = document.querySelector('.bg-blue-50');
      expect(segmentsContainer).not.toBeNull();
    });

    it('should show ghost segment when relabel target from different speaker', () => {
      useEditorStore.setState({
        dragState: {
          type: 'relabel',
          segmentId: 'seg-3',
          originalSegment: mockSegments[2], // From SPEAKER_01
          currentSpeakerId: 'SPEAKER_00',
        },
      });

      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      expect(screen.getByTestId('ghost-segment')).toBeInTheDocument();
    });

    it('should not show ghost segment when relabel target is same speaker', () => {
      useEditorStore.setState({
        dragState: {
          type: 'relabel',
          segmentId: 'seg-1',
          originalSegment: mockSegments[0], // From SPEAKER_00
          currentSpeakerId: 'SPEAKER_00',
        },
      });

      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      expect(screen.queryByTestId('ghost-segment')).not.toBeInTheDocument();
    });

    it('should update drag state currentSpeakerId on mouse move', () => {
      useEditorStore.setState({
        dragState: {
          type: 'relabel',
          segmentId: 'seg-3',
          originalSegment: mockSegments[2],
          currentSpeakerId: 'SPEAKER_01',
        },
      });

      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const segmentsContainer = document.querySelector('[style*="width: 6000px"]');
      fireEvent.mouseMove(segmentsContainer!);

      expect(useEditorStore.getState().dragState?.currentSpeakerId).toBe('SPEAKER_00');
    });
  });

  describe('speaker merge (drag and drop)', () => {
    it('should show drag over styling when dragging speaker over', () => {
      const { container } = render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const label = container.querySelector('[data-speaker-label]');

      // Simulate drag over with speaker ID
      fireEvent.dragOver(label!, {
        dataTransfer: {
          types: ['application/speaker-id'],
          dropEffect: '',
        },
      });

      // Check for ring styling indicating drag over
      expect(label?.className).toContain('ring-2');
    });

    it('should show merge modal after drop', () => {
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const label = document.querySelector('[data-speaker-label]');

      fireEvent.drop(label!, {
        dataTransfer: {
          getData: () => 'SPEAKER_01',
        },
      });

      expect(screen.getByTestId('merge-modal')).toBeInTheDocument();
      expect(screen.getByText('Merge SPEAKER_01 into SPEAKER_00')).toBeInTheDocument();
    });

    it('should merge speakers on confirm', () => {
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const label = document.querySelector('[data-speaker-label]');

      fireEvent.drop(label!, {
        dataTransfer: {
          getData: () => 'SPEAKER_01',
        },
      });

      fireEvent.click(screen.getByText('Confirm'));

      // All segments should now be SPEAKER_00
      const segments = useEditorStore.getState().segments;
      expect(segments.every((s) => s.speakerId === 'SPEAKER_00')).toBe(true);
    });

    it('should close modal on cancel without merging', () => {
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const label = document.querySelector('[data-speaker-label]');

      fireEvent.drop(label!, {
        dataTransfer: {
          getData: () => 'SPEAKER_01',
        },
      });

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByTestId('merge-modal')).not.toBeInTheDocument();

      // Segments should be unchanged
      const segments = useEditorStore.getState().segments;
      expect(segments.find((s) => s.id === 'seg-3')?.speakerId).toBe('SPEAKER_01');
    });
  });

  describe('label width resize', () => {
    it('should have resize handle', () => {
      const { container } = render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const resizeHandle = container.querySelector('.cursor-col-resize');
      expect(resizeHandle).not.toBeNull();
    });
  });

  describe('draggable label', () => {
    it('should be draggable when not editing', () => {
      const { container } = render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      const label = container.querySelector('[data-speaker-label]');
      expect(label?.getAttribute('draggable')).toBe('true');
    });

    it('should not be draggable when editing', () => {
      render(<SpeakerLane speakerId="SPEAKER_00" index={0} />);

      // Enter edit mode
      fireEvent.click(screen.getByText('SPEAKER_00'));

      const label = document.querySelector('[data-speaker-label]');
      expect(label?.getAttribute('draggable')).toBe('false');
    });
  });
});
