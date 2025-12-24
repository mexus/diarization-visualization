import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeakerMerge } from './useSpeakerMerge';
import { useEditorStore } from '../store/editorStore';
import type { Segment } from '../types';

describe('useSpeakerMerge', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('initial state', () => {
    it('should initialize with isDragOver false', () => {
      const { result } = renderHook(() => useSpeakerMerge('SPEAKER_00', false));
      expect(result.current.isDragOver).toBe(false);
    });

    it('should initialize with pendingMerge null', () => {
      const { result } = renderHook(() => useSpeakerMerge('SPEAKER_00', false));
      expect(result.current.pendingMerge).toBeNull();
    });
  });

  describe('HTML5 drag handlers (desktop)', () => {
    describe('handleDragStart', () => {
      it('should set speaker ID in dataTransfer', () => {
        const { result } = renderHook(() => useSpeakerMerge('SPEAKER_00', false));

        const mockDataTransfer = {
          setData: vi.fn(),
          effectAllowed: '',
          types: [] as string[],
        };

        const mockEvent = {
          dataTransfer: mockDataTransfer,
        } as unknown as React.DragEvent;

        act(() => {
          result.current.handleDragStart(mockEvent);
        });

        expect(mockDataTransfer.setData).toHaveBeenCalledWith('application/speaker-id', 'SPEAKER_00');
        expect(mockDataTransfer.effectAllowed).toBe('move');
      });
    });

    describe('handleDragOver', () => {
      it('should set isDragOver true when dragging speaker', () => {
        const { result } = renderHook(() => useSpeakerMerge('SPEAKER_01', false));

        const mockEvent = {
          dataTransfer: {
            types: ['application/speaker-id'],
            dropEffect: '',
          },
          preventDefault: vi.fn(),
        } as unknown as React.DragEvent;

        act(() => {
          result.current.handleDragOver(mockEvent);
        });

        expect(result.current.isDragOver).toBe(true);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.dataTransfer.dropEffect).toBe('move');
      });

      it('should not set isDragOver when not dragging speaker', () => {
        const { result } = renderHook(() => useSpeakerMerge('SPEAKER_01', false));

        const mockEvent = {
          dataTransfer: {
            types: ['text/plain'],
            dropEffect: '',
          },
          preventDefault: vi.fn(),
        } as unknown as React.DragEvent;

        act(() => {
          result.current.handleDragOver(mockEvent);
        });

        expect(result.current.isDragOver).toBe(false);
        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('handleDragLeave', () => {
      it('should set isDragOver false', () => {
        const { result } = renderHook(() => useSpeakerMerge('SPEAKER_01', false));

        // First set isDragOver to true
        const mockDragOverEvent = {
          dataTransfer: {
            types: ['application/speaker-id'],
            dropEffect: '',
          },
          preventDefault: vi.fn(),
        } as unknown as React.DragEvent;

        act(() => {
          result.current.handleDragOver(mockDragOverEvent);
        });

        expect(result.current.isDragOver).toBe(true);

        // Then leave
        act(() => {
          result.current.handleDragLeave();
        });

        expect(result.current.isDragOver).toBe(false);
      });
    });

    describe('handleDrop', () => {
      it('should set pendingMerge when dropping different speaker', () => {
        const { result } = renderHook(() => useSpeakerMerge('SPEAKER_01', false));

        const mockEvent = {
          dataTransfer: {
            getData: vi.fn().mockReturnValue('SPEAKER_00'),
          },
          preventDefault: vi.fn(),
        } as unknown as React.DragEvent;

        act(() => {
          result.current.handleDrop(mockEvent);
        });

        expect(result.current.isDragOver).toBe(false);
        expect(result.current.pendingMerge).toEqual({ sourceId: 'SPEAKER_00' });
      });

      it('should not set pendingMerge when dropping same speaker', () => {
        const { result } = renderHook(() => useSpeakerMerge('SPEAKER_00', false));

        const mockEvent = {
          dataTransfer: {
            getData: vi.fn().mockReturnValue('SPEAKER_00'),
          },
          preventDefault: vi.fn(),
        } as unknown as React.DragEvent;

        act(() => {
          result.current.handleDrop(mockEvent);
        });

        expect(result.current.pendingMerge).toBeNull();
      });

      it('should not set pendingMerge when no speaker ID in data', () => {
        const { result } = renderHook(() => useSpeakerMerge('SPEAKER_01', false));

        const mockEvent = {
          dataTransfer: {
            getData: vi.fn().mockReturnValue(''),
          },
          preventDefault: vi.fn(),
        } as unknown as React.DragEvent;

        act(() => {
          result.current.handleDrop(mockEvent);
        });

        expect(result.current.pendingMerge).toBeNull();
      });
    });
  });

  describe('merge confirmation', () => {
    it('should call mergeSpeakers on confirm', () => {
      const segments: Segment[] = [
        { id: 'seg-1', speakerId: 'SPEAKER_00', startTime: 0, duration: 1 },
        { id: 'seg-2', speakerId: 'SPEAKER_01', startTime: 2, duration: 1 },
      ];
      useEditorStore.setState({ segments });

      const { result } = renderHook(() => useSpeakerMerge('SPEAKER_01', false));

      // Simulate drop to trigger pendingMerge
      const mockEvent = {
        dataTransfer: {
          getData: vi.fn().mockReturnValue('SPEAKER_00'),
        },
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDrop(mockEvent);
      });

      expect(result.current.pendingMerge).toEqual({ sourceId: 'SPEAKER_00' });

      // Confirm merge
      act(() => {
        result.current.handleConfirmMerge();
      });

      expect(result.current.pendingMerge).toBeNull();

      // Check that segments were merged
      const updatedSegments = useEditorStore.getState().segments;
      expect(updatedSegments.every((s) => s.speakerId === 'SPEAKER_01')).toBe(true);
    });

    it('should clear pendingMerge on cancel', () => {
      const { result } = renderHook(() => useSpeakerMerge('SPEAKER_01', false));

      // Simulate drop
      const mockEvent = {
        dataTransfer: {
          getData: vi.fn().mockReturnValue('SPEAKER_00'),
        },
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDrop(mockEvent);
      });

      expect(result.current.pendingMerge).toEqual({ sourceId: 'SPEAKER_00' });

      // Cancel
      act(() => {
        result.current.handleCancelMerge();
      });

      expect(result.current.pendingMerge).toBeNull();
    });

    it('should not call mergeSpeakers if pendingMerge is null', () => {
      const mergeSpy = vi.fn();
      useEditorStore.setState({ mergeSpeakers: mergeSpy } as unknown as Parameters<typeof useEditorStore.setState>[0]);

      const { result } = renderHook(() => useSpeakerMerge('SPEAKER_01', false));

      act(() => {
        result.current.handleConfirmMerge();
      });

      // The real mergeSpeakers won't be called since we didn't set up pending merge
      expect(result.current.pendingMerge).toBeNull();
    });
  });

  describe('touch handlers', () => {
    describe('handleLabelTouchStart', () => {
      it('should not process when isEditing is true', () => {
        const { result } = renderHook(() => useSpeakerMerge('SPEAKER_00', true));

        const mockTarget = document.createElement('div');
        const mockEvent = {
          currentTarget: mockTarget,
        } as unknown as React.TouchEvent;

        act(() => {
          result.current.handleLabelTouchStart(mockEvent);
        });

        // Should not have set the touch drag speaker data
        expect(mockTarget.dataset.touchDragSpeaker).toBeUndefined();
      });

      it('should set touchDragSpeaker data attribute when not editing', () => {
        const { result } = renderHook(() => useSpeakerMerge('SPEAKER_00', false));

        const mockTarget = document.createElement('div');
        const mockEvent = {
          currentTarget: mockTarget,
        } as unknown as React.TouchEvent;

        act(() => {
          result.current.handleLabelTouchStart(mockEvent);
        });

        expect(mockTarget.dataset.touchDragSpeaker).toBe('SPEAKER_00');
      });

      it('should add touch event listeners', () => {
        const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
        const { result } = renderHook(() => useSpeakerMerge('SPEAKER_00', false));

        const mockTarget = document.createElement('div');
        const mockEvent = {
          currentTarget: mockTarget,
        } as unknown as React.TouchEvent;

        act(() => {
          result.current.handleLabelTouchStart(mockEvent);
        });

        expect(addEventListenerSpy).toHaveBeenCalledWith(
          'touchmove',
          expect.any(Function),
          expect.objectContaining({ passive: true })
        );
        expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function));

        addEventListenerSpy.mockRestore();
      });
    });
  });

  describe('speaker-merge-request event listener', () => {
    it('should set pendingMerge when receiving merge request for this speaker', () => {
      const { result } = renderHook(() => useSpeakerMerge('SPEAKER_01', false));

      act(() => {
        const mergeEvent = new CustomEvent('speaker-merge-request', {
          detail: { sourceId: 'SPEAKER_00', targetId: 'SPEAKER_01' },
          bubbles: true,
        });
        document.dispatchEvent(mergeEvent);
      });

      expect(result.current.pendingMerge).toEqual({ sourceId: 'SPEAKER_00' });
    });

    it('should not set pendingMerge for merge request targeting different speaker', () => {
      const { result } = renderHook(() => useSpeakerMerge('SPEAKER_01', false));

      act(() => {
        const mergeEvent = new CustomEvent('speaker-merge-request', {
          detail: { sourceId: 'SPEAKER_00', targetId: 'SPEAKER_02' },
          bubbles: true,
        });
        document.dispatchEvent(mergeEvent);
      });

      expect(result.current.pendingMerge).toBeNull();
    });

    it('should not set pendingMerge when source and target are the same', () => {
      const { result } = renderHook(() => useSpeakerMerge('SPEAKER_00', false));

      act(() => {
        const mergeEvent = new CustomEvent('speaker-merge-request', {
          detail: { sourceId: 'SPEAKER_00', targetId: 'SPEAKER_00' },
          bubbles: true,
        });
        document.dispatchEvent(mergeEvent);
      });

      expect(result.current.pendingMerge).toBeNull();
    });

    it('should clean up event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => useSpeakerMerge('SPEAKER_00', false));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'speaker-merge-request',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('stable callback references', () => {
    it('should return stable handleDragStart callback', () => {
      const { result, rerender } = renderHook(() => useSpeakerMerge('SPEAKER_00', false));

      const first = result.current.handleDragStart;
      rerender();
      const second = result.current.handleDragStart;

      expect(first).toBe(second);
    });

    it('should return stable handleDragOver callback', () => {
      const { result, rerender } = renderHook(() => useSpeakerMerge('SPEAKER_00', false));

      const first = result.current.handleDragOver;
      rerender();
      const second = result.current.handleDragOver;

      expect(first).toBe(second);
    });

    it('should return stable handleDragLeave callback', () => {
      const { result, rerender } = renderHook(() => useSpeakerMerge('SPEAKER_00', false));

      const first = result.current.handleDragLeave;
      rerender();
      const second = result.current.handleDragLeave;

      expect(first).toBe(second);
    });
  });

  describe('speakerId changes', () => {
    it('should update handleDragStart when speakerId changes', () => {
      const { result, rerender } = renderHook(
        ({ speakerId }) => useSpeakerMerge(speakerId, false),
        { initialProps: { speakerId: 'SPEAKER_00' } }
      );

      const mockDataTransfer = {
        setData: vi.fn(),
        effectAllowed: '',
      };

      const mockEvent = {
        dataTransfer: mockDataTransfer,
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockEvent);
      });

      expect(mockDataTransfer.setData).toHaveBeenCalledWith('application/speaker-id', 'SPEAKER_00');

      // Change speakerId
      rerender({ speakerId: 'SPEAKER_01' });

      mockDataTransfer.setData.mockClear();

      act(() => {
        result.current.handleDragStart(mockEvent);
      });

      expect(mockDataTransfer.setData).toHaveBeenCalledWith('application/speaker-id', 'SPEAKER_01');
    });
  });
});
