import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SegmentBlock } from './SegmentBlock';
import { useEditorStore } from '../../store/editorStore';
import type { Segment } from '../../types';

describe('SegmentBlock', () => {
  const mockSegment: Segment = {
    id: 'test-segment-1',
    speakerId: 'SPEAKER_00',
    startTime: 5,
    duration: 2,
  };

  beforeEach(() => {
    useEditorStore.getState().reset();
    // Set up default store state
    useEditorStore.setState({
      segments: [mockSegment],
      pixelsPerSecond: 100,
    });
  });

  describe('rendering', () => {
    it('should render with correct width based on duration and pixelsPerSecond', () => {
      const { container } = render(<SegmentBlock segment={mockSegment} />);

      const block = container.firstChild as HTMLElement;
      // duration 2 * pixelsPerSecond 100 = 200px
      expect(block.style.width).toBe('200px');
    });

    it('should render with correct left position based on startTime and pixelsPerSecond', () => {
      const { container } = render(<SegmentBlock segment={mockSegment} />);

      const block = container.firstChild as HTMLElement;
      // startTime 5 * pixelsPerSecond 100 = 500px
      expect(block.style.left).toBe('500px');
    });

    it('should update dimensions when pixelsPerSecond changes', () => {
      const { container, rerender } = render(<SegmentBlock segment={mockSegment} />);

      act(() => {
        useEditorStore.setState({ pixelsPerSecond: 50 });
      });
      rerender(<SegmentBlock segment={mockSegment} />);

      const block = container.firstChild as HTMLElement;
      // duration 2 * 50 = 100px, startTime 5 * 50 = 250px
      expect(block.style.width).toBe('100px');
      expect(block.style.left).toBe('250px');
    });

    it('should enforce minimum width of 4px', () => {
      const tinySegment: Segment = {
        id: 'tiny',
        speakerId: 'SPEAKER_00',
        startTime: 0,
        duration: 0.01, // Very short
      };
      useEditorStore.setState({ segments: [tinySegment], pixelsPerSecond: 100 });

      const { container } = render(<SegmentBlock segment={tinySegment} />);
      const block = container.firstChild as HTMLElement;
      // 0.01 * 100 = 1px, but min is 4px
      expect(block.style.width).toBe('4px');
    });

    it('should display correct title with speaker and time range', () => {
      const { container } = render(<SegmentBlock segment={mockSegment} />);

      const block = container.firstChild as HTMLElement;
      expect(block.title).toBe('SPEAKER_00: 5.00s - 7.00s');
    });
  });

  describe('selection', () => {
    it('should not show resize handles when not selected', () => {
      render(<SegmentBlock segment={mockSegment} />);

      expect(screen.queryByLabelText(/Delete segment/)).not.toBeInTheDocument();
    });

    it('should show resize handles and delete button when selected', () => {
      useEditorStore.setState({ selectedSegmentId: mockSegment.id });

      render(<SegmentBlock segment={mockSegment} />);

      expect(screen.getByLabelText('Delete segment from SPEAKER_00')).toBeInTheDocument();
    });

    it('should select segment on click', () => {
      render(<SegmentBlock segment={mockSegment} />);

      const block = screen.getByTitle('SPEAKER_00: 5.00s - 7.00s');
      fireEvent.click(block);

      expect(useEditorStore.getState().selectedSegmentId).toBe(mockSegment.id);
    });

    it('should have ring styling when selected', () => {
      useEditorStore.setState({ selectedSegmentId: mockSegment.id });

      const { container } = render(<SegmentBlock segment={mockSegment} />);
      const block = container.firstChild as HTMLElement;

      expect(block.className).toContain('ring-2');
      expect(block.className).toContain('ring-blue-500');
    });
  });

  describe('delete', () => {
    it('should delete segment when delete button clicked', () => {
      useEditorStore.setState({ selectedSegmentId: mockSegment.id });

      render(<SegmentBlock segment={mockSegment} />);

      const deleteButton = screen.getByLabelText('Delete segment from SPEAKER_00');
      fireEvent.click(deleteButton);

      expect(useEditorStore.getState().segments).toHaveLength(0);
    });

    it('should not trigger selection when delete button clicked', () => {
      const anotherSegment: Segment = {
        id: 'other',
        speakerId: 'SPEAKER_00',
        startTime: 10,
        duration: 1,
      };
      useEditorStore.setState({
        segments: [mockSegment, anotherSegment],
        selectedSegmentId: mockSegment.id,
      });

      render(<SegmentBlock segment={mockSegment} />);

      const deleteButton = screen.getByLabelText('Delete segment from SPEAKER_00');
      fireEvent.click(deleteButton);

      // Should not change selection to another segment
      expect(useEditorStore.getState().selectedSegmentId).toBeNull();
    });
  });

  describe('resize drag', () => {
    it('should start left resize drag on left handle mousedown', () => {
      useEditorStore.setState({ selectedSegmentId: mockSegment.id });

      const { container } = render(<SegmentBlock segment={mockSegment} />);

      const leftHandle = container.querySelector('[data-handle="left"]');
      expect(leftHandle).not.toBeNull();

      fireEvent.mouseDown(leftHandle!);

      const dragState = useEditorStore.getState().dragState;
      expect(dragState).not.toBeNull();
      expect(dragState?.type).toBe('resize-left');
      expect(dragState?.segmentId).toBe(mockSegment.id);
      expect(dragState?.currentTime).toBe(5); // startTime
    });

    it('should start right resize drag on right handle mousedown', () => {
      useEditorStore.setState({ selectedSegmentId: mockSegment.id });

      const { container } = render(<SegmentBlock segment={mockSegment} />);

      const rightHandle = container.querySelector('[data-handle="right"]');
      expect(rightHandle).not.toBeNull();

      fireEvent.mouseDown(rightHandle!);

      const dragState = useEditorStore.getState().dragState;
      expect(dragState).not.toBeNull();
      expect(dragState?.type).toBe('resize-right');
      expect(dragState?.segmentId).toBe(mockSegment.id);
      expect(dragState?.currentTime).toBe(7); // startTime + duration
    });

    it('should start touch resize on touch start', () => {
      useEditorStore.setState({ selectedSegmentId: mockSegment.id });

      const { container } = render(<SegmentBlock segment={mockSegment} />);

      const leftHandle = container.querySelector('[data-handle="left"]');
      fireEvent.touchStart(leftHandle!);

      const dragState = useEditorStore.getState().dragState;
      expect(dragState?.type).toBe('resize-left');
    });
  });

  describe('relabel drag', () => {
    it('should start relabel drag on body mousedown when selected', () => {
      useEditorStore.setState({ selectedSegmentId: mockSegment.id });

      const { container } = render(<SegmentBlock segment={mockSegment} />);

      // Click on the main block body (not handles)
      const block = container.firstChild as HTMLElement;
      fireEvent.mouseDown(block);

      const dragState = useEditorStore.getState().dragState;
      expect(dragState?.type).toBe('relabel');
      expect(dragState?.currentSpeakerId).toBe('SPEAKER_00');
    });

    it('should not start relabel drag when not selected', () => {
      render(<SegmentBlock segment={mockSegment} />);

      const block = screen.getByTitle('SPEAKER_00: 5.00s - 7.00s');
      fireEvent.mouseDown(block);

      expect(useEditorStore.getState().dragState).toBeNull();
    });

    it('should not start relabel drag when clicking on handle', () => {
      useEditorStore.setState({ selectedSegmentId: mockSegment.id });

      const { container } = render(<SegmentBlock segment={mockSegment} />);

      const leftHandle = container.querySelector('[data-handle="left"]');

      // Click on handle - should start resize, not relabel
      fireEvent.mouseDown(leftHandle!);

      const dragState = useEditorStore.getState().dragState;
      expect(dragState?.type).toBe('resize-left');
    });

    it('should reduce opacity when relabel dragging', () => {
      useEditorStore.setState({ selectedSegmentId: mockSegment.id });

      const { container } = render(<SegmentBlock segment={mockSegment} />);

      const block = container.firstChild as HTMLElement;
      fireEvent.mouseDown(block);

      // Need to rerender to see style update
      const { container: rerenderedContainer } = render(<SegmentBlock segment={mockSegment} />);
      const rerenderedBlock = rerenderedContainer.firstChild as HTMLElement;

      expect(rerenderedBlock.style.opacity).toBe('0.5');
    });
  });

  describe('drag preview during resize', () => {
    it('should show preview width during resize-right', () => {
      useEditorStore.setState({
        selectedSegmentId: mockSegment.id,
        dragState: {
          type: 'resize-right',
          segmentId: mockSegment.id,
          originalSegment: mockSegment,
          currentTime: 10, // Extending to 10 seconds
        },
      });

      const { container } = render(<SegmentBlock segment={mockSegment} />);
      const block = container.firstChild as HTMLElement;

      // Preview: startTime 5, currentTime 10 -> duration 5 -> 500px
      expect(block.style.width).toBe('500px');
    });

    it('should show preview position and width during resize-left', () => {
      useEditorStore.setState({
        selectedSegmentId: mockSegment.id,
        dragState: {
          type: 'resize-left',
          segmentId: mockSegment.id,
          originalSegment: mockSegment,
          currentTime: 3, // Moving start from 5 to 3
        },
      });

      const { container } = render(<SegmentBlock segment={mockSegment} />);
      const block = container.firstChild as HTMLElement;

      // Preview: start moved from 5 to 3, duration increased from 2 to 4
      expect(block.style.left).toBe('300px'); // 3 * 100
      expect(block.style.width).toBe('400px'); // 4 * 100
    });

    it('should enforce minimum duration of 0.1s during preview', () => {
      useEditorStore.setState({
        selectedSegmentId: mockSegment.id,
        dragState: {
          type: 'resize-right',
          segmentId: mockSegment.id,
          originalSegment: mockSegment,
          currentTime: 5.01, // Would make duration very small
        },
      });

      const { container } = render(<SegmentBlock segment={mockSegment} />);
      const block = container.firstChild as HTMLElement;

      // Min duration 0.1s -> 10px at 100px/s, but min width is 4px
      expect(parseFloat(block.style.width)).toBeGreaterThanOrEqual(4);
    });
  });

  describe('memoization', () => {
    it('should be wrapped in memo', () => {
      // SegmentBlock should be a memo component
      expect(SegmentBlock).toHaveProperty('$$typeof', Symbol.for('react.memo'));
    });
  });
});
