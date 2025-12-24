import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragHandlers } from './useDragHandlers';
import { useEditorStore } from '../store/editorStore';
import type { Segment } from '../types';

describe('useDragHandlers', () => {
  const mockSegment: Segment = {
    id: 'test-segment-1',
    speakerId: 'SPEAKER_00',
    startTime: 5,
    duration: 2,
  };

  let mockScrollContainer: HTMLDivElement;

  beforeEach(() => {
    // Reset the store
    useEditorStore.getState().reset();

    // Create mock DOM elements
    mockScrollContainer = document.createElement('div');
    mockScrollContainer.setAttribute('data-scroll-container', 'true');
    mockScrollContainer.style.width = '1000px';
    mockScrollContainer.style.height = '200px';
    mockScrollContainer.getBoundingClientRect = () => ({
      left: 100,
      top: 50,
      right: 1100,
      bottom: 250,
      width: 1000,
      height: 200,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    });
    Object.defineProperty(mockScrollContainer, 'scrollLeft', { value: 0, writable: true });
    document.body.appendChild(mockScrollContainer);

    // Set up store with some initial values
    useEditorStore.setState({
      pixelsPerSecond: 100,
      labelWidth: 100,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('event listener attachment', () => {
    it('should not attach listeners when dragState is null', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      renderHook(() => useDragHandlers());

      // Should not have added any drag-related listeners
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('mouseup', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should attach listeners when dragState is active', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      // Start a drag operation
      useEditorStore.getState().startDrag({
        type: 'resize-right',
        segmentId: mockSegment.id,
        originalSegment: mockSegment,
      });

      renderHook(() => useDragHandlers());

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function),
        expect.objectContaining({ passive: false })
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should remove listeners on cleanup', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      useEditorStore.getState().startDrag({
        type: 'resize-right',
        segmentId: mockSegment.id,
        originalSegment: mockSegment,
      });

      const { unmount } = renderHook(() => useDragHandlers());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('resize-left drag', () => {
    it('should update currentTime based on mouse position', () => {
      // Add segment to store
      useEditorStore.setState({ segments: [mockSegment] });

      // Start resize-left drag
      useEditorStore.getState().startDrag({
        type: 'resize-left',
        segmentId: mockSegment.id,
        originalSegment: mockSegment,
      });

      renderHook(() => useDragHandlers());

      // Simulate mouse move
      // clientX = 300, container.left = 100, scrollLeft = 0, labelWidth = 100
      // mouseX = 300 - 100 + 0 - 100 = 100
      // time = 100 / 100 (pixelsPerSecond) = 1
      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: 300,
          clientY: 100,
        });
        document.dispatchEvent(mouseMoveEvent);
      });

      const dragState = useEditorStore.getState().dragState;
      expect(dragState?.currentTime).toBe(1);
    });

    it('should apply resize-left on mouseup', () => {
      const segment: Segment = {
        id: 'test-segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 5,
        duration: 2,
      };

      useEditorStore.setState({ segments: [segment] });

      // Start resize-left drag
      useEditorStore.getState().startDrag({
        type: 'resize-left',
        segmentId: segment.id,
        originalSegment: segment,
      });

      // Update with new time
      useEditorStore.getState().updateDrag({ currentTime: 4 });

      renderHook(() => useDragHandlers());

      // End drag
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      // Drag should be ended
      expect(useEditorStore.getState().dragState).toBeNull();

      // Segment should be updated: startTime moved from 5 to 4, duration increased by 1
      const updatedSegment = useEditorStore.getState().segments[0];
      expect(updatedSegment.startTime).toBe(4);
      expect(updatedSegment.duration).toBe(3); // original 2 + 1 delta
    });
  });

  describe('resize-right drag', () => {
    it('should update currentTime based on mouse position', () => {
      useEditorStore.setState({ segments: [mockSegment] });

      // Start resize-right drag
      useEditorStore.getState().startDrag({
        type: 'resize-right',
        segmentId: mockSegment.id,
        originalSegment: mockSegment,
      });

      renderHook(() => useDragHandlers());

      // Simulate mouse move to x=800
      // mouseX = 800 - 100 + 0 - 100 = 600
      // time = 600 / 100 = 6
      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: 800,
          clientY: 100,
        });
        document.dispatchEvent(mouseMoveEvent);
      });

      const dragState = useEditorStore.getState().dragState;
      expect(dragState?.currentTime).toBe(6);
    });

    it('should apply resize-right on mouseup', () => {
      const segment: Segment = {
        id: 'test-segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 5,
        duration: 2,
      };

      useEditorStore.setState({ segments: [segment] });

      // Start resize-right drag
      useEditorStore.getState().startDrag({
        type: 'resize-right',
        segmentId: segment.id,
        originalSegment: segment,
      });

      // Update with new end time at 9 (startTime 5, so duration would be 4)
      useEditorStore.getState().updateDrag({ currentTime: 9 });

      renderHook(() => useDragHandlers());

      // End drag
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      expect(useEditorStore.getState().dragState).toBeNull();

      const updatedSegment = useEditorStore.getState().segments[0];
      expect(updatedSegment.startTime).toBe(5);
      expect(updatedSegment.duration).toBe(4); // 9 - 5 = 4
    });

    it('should clamp time to zero for mouse positions before timeline start', () => {
      useEditorStore.setState({ segments: [mockSegment] });

      useEditorStore.getState().startDrag({
        type: 'resize-left',
        segmentId: mockSegment.id,
        originalSegment: mockSegment,
      });

      renderHook(() => useDragHandlers());

      // Mouse position that would result in negative time
      // clientX = 50, container.left = 100 -> negative relative position
      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: 50,
          clientY: 100,
        });
        document.dispatchEvent(mouseMoveEvent);
      });

      const dragState = useEditorStore.getState().dragState;
      expect(dragState?.currentTime).toBe(0);
    });
  });

  describe('relabel drag', () => {
    it('should find target lane by Y position', () => {
      // Create mock speaker lanes
      const lane1 = document.createElement('div');
      lane1.setAttribute('data-speaker-lane', 'SPEAKER_00');
      lane1.getBoundingClientRect = () => ({
        top: 100,
        bottom: 150,
        left: 0,
        right: 1000,
        width: 1000,
        height: 50,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      });
      document.body.appendChild(lane1);

      const lane2 = document.createElement('div');
      lane2.setAttribute('data-speaker-lane', 'SPEAKER_01');
      lane2.getBoundingClientRect = () => ({
        top: 150,
        bottom: 200,
        left: 0,
        right: 1000,
        width: 1000,
        height: 50,
        x: 0,
        y: 150,
        toJSON: () => ({}),
      });
      document.body.appendChild(lane2);

      useEditorStore.setState({ segments: [mockSegment] });

      // Start relabel drag
      useEditorStore.getState().startDrag({
        type: 'relabel',
        segmentId: mockSegment.id,
        originalSegment: mockSegment,
      });

      renderHook(() => useDragHandlers());

      // Simulate mouse move over lane2
      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: 500,
          clientY: 175, // Between 150-200, so lane2
        });
        document.dispatchEvent(mouseMoveEvent);
      });

      const dragState = useEditorStore.getState().dragState;
      expect(dragState?.currentSpeakerId).toBe('SPEAKER_01');
    });

    it('should apply relabel on mouseup when speaker changed', () => {
      const segment: Segment = {
        id: 'test-segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 5,
        duration: 2,
      };

      useEditorStore.setState({ segments: [segment] });

      // Start relabel drag
      useEditorStore.getState().startDrag({
        type: 'relabel',
        segmentId: segment.id,
        originalSegment: segment,
      });

      // Update with new speaker
      useEditorStore.getState().updateDrag({ currentSpeakerId: 'SPEAKER_01' });

      renderHook(() => useDragHandlers());

      // End drag
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      expect(useEditorStore.getState().dragState).toBeNull();

      const updatedSegment = useEditorStore.getState().segments[0];
      expect(updatedSegment.speakerId).toBe('SPEAKER_01');
    });

    it('should not update segment if speaker is the same', () => {
      const segment: Segment = {
        id: 'test-segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 5,
        duration: 2,
      };

      useEditorStore.setState({ segments: [segment] });

      // Start relabel drag
      useEditorStore.getState().startDrag({
        type: 'relabel',
        segmentId: segment.id,
        originalSegment: segment,
      });

      // Keep same speaker
      useEditorStore.getState().updateDrag({ currentSpeakerId: 'SPEAKER_00' });

      renderHook(() => useDragHandlers());

      const historyBefore = useEditorStore.getState().history.length;

      // End drag
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      // No history entry should be added since nothing changed
      expect(useEditorStore.getState().history.length).toBe(historyBefore);
    });
  });

  describe('touch events', () => {
    it('should handle touch move events', () => {
      useEditorStore.setState({ segments: [mockSegment] });

      useEditorStore.getState().startDrag({
        type: 'resize-right',
        segmentId: mockSegment.id,
        originalSegment: mockSegment,
      });

      renderHook(() => useDragHandlers());

      // Simulate touch move
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 500, clientY: 100 } as Touch],
      });

      act(() => {
        document.dispatchEvent(touchMoveEvent);
      });

      // mouseX = 500 - 100 + 0 - 100 = 300
      // time = 300 / 100 = 3
      const dragState = useEditorStore.getState().dragState;
      expect(dragState?.currentTime).toBe(3);
    });

    it('should handle touch end events', () => {
      const segment: Segment = {
        id: 'test-segment-1',
        speakerId: 'SPEAKER_00',
        startTime: 5,
        duration: 2,
      };

      useEditorStore.setState({ segments: [segment] });

      useEditorStore.getState().startDrag({
        type: 'resize-right',
        segmentId: segment.id,
        originalSegment: segment,
      });

      useEditorStore.getState().updateDrag({ currentTime: 10 });

      renderHook(() => useDragHandlers());

      act(() => {
        document.dispatchEvent(new TouchEvent('touchend'));
      });

      expect(useEditorStore.getState().dragState).toBeNull();

      const updatedSegment = useEditorStore.getState().segments[0];
      expect(updatedSegment.duration).toBe(5); // 10 - 5
    });

    it('should handle touch cancel events', () => {
      useEditorStore.setState({ segments: [mockSegment] });

      useEditorStore.getState().startDrag({
        type: 'resize-right',
        segmentId: mockSegment.id,
        originalSegment: mockSegment,
      });

      renderHook(() => useDragHandlers());

      act(() => {
        document.dispatchEvent(new TouchEvent('touchcancel'));
      });

      expect(useEditorStore.getState().dragState).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle missing scroll container gracefully', () => {
      document.body.innerHTML = ''; // Remove the mock container

      useEditorStore.setState({ segments: [mockSegment] });

      useEditorStore.getState().startDrag({
        type: 'resize-right',
        segmentId: mockSegment.id,
        originalSegment: mockSegment,
      });

      renderHook(() => useDragHandlers());

      // Should not throw
      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: 500,
          clientY: 100,
        });
        document.dispatchEvent(mouseMoveEvent);
      });

      // currentTime should not be updated
      const dragState = useEditorStore.getState().dragState;
      expect(dragState?.currentTime).toBeUndefined();
    });

    it('should handle mouseup when dragState is already null', () => {
      renderHook(() => useDragHandlers());

      // Should not throw
      expect(() => {
        act(() => {
          document.dispatchEvent(new MouseEvent('mouseup'));
        });
      }).not.toThrow();
    });
  });
});
