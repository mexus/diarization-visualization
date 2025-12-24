import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, type ToastType } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('showToast', () => {
    it('should add a toast to the list', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('success', 'Test message');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Test message',
      });
      expect(result.current.toasts[0].id).toBeDefined();
    });

    it('should support different toast types', () => {
      const { result } = renderHook(() => useToast());
      const types: ToastType[] = ['info', 'success', 'warning', 'error'];

      types.forEach((type) => {
        act(() => {
          result.current.showToast(type, `${type} message`);
        });
      });

      expect(result.current.toasts).toHaveLength(4);
      types.forEach((type, index) => {
        expect(result.current.toasts[index].type).toBe(type);
        expect(result.current.toasts[index].message).toBe(`${type} message`);
      });
    });

    it('should assign unique IDs to each toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('info', 'First');
        result.current.showToast('info', 'Second');
        result.current.showToast('info', 'Third');
      });

      const ids = result.current.toasts.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('auto-dismiss', () => {
    it('should auto-dismiss after default duration (3000ms)', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('success', 'Test message');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(2999);
      });
      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    it('should auto-dismiss after custom duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('success', 'Test message', 5000);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(4999);
      });
      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    it('should dismiss toasts independently based on their duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('info', 'Short', 1000);
        result.current.showToast('info', 'Medium', 2000);
        result.current.showToast('info', 'Long', 3000);
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts.map((t) => t.message)).toEqual(['Medium', 'Long']);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Long');

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('dismissToast', () => {
    it('should manually dismiss a toast by ID', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('success', 'Test message');
      });

      const toastId = result.current.toasts[0].id;

      act(() => {
        result.current.dismissToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should clear the auto-dismiss timeout when manually dismissed', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('success', 'Test message', 5000);
      });

      const toastId = result.current.toasts[0].id;

      act(() => {
        result.current.dismissToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);

      // Advance past the original timeout - should not cause any issues
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should only dismiss the specified toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('info', 'First');
        result.current.showToast('success', 'Second');
        result.current.showToast('warning', 'Third');
      });

      const secondToastId = result.current.toasts[1].id;

      act(() => {
        result.current.dismissToast(secondToastId);
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts.map((t) => t.message)).toEqual(['First', 'Third']);
    });

    it('should handle dismissing non-existent toast ID gracefully', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('success', 'Test message');
      });

      act(() => {
        result.current.dismissToast('non-existent-id');
      });

      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe('cleanup', () => {
    it('should clean up timeouts on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      const { result, unmount } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('info', 'First', 5000);
        result.current.showToast('info', 'Second', 10000);
      });

      expect(result.current.toasts).toHaveLength(2);

      unmount();

      // clearTimeout should have been called for each active toast
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('stable references', () => {
    it('should return stable showToast function', () => {
      const { result, rerender } = renderHook(() => useToast());

      const firstShowToast = result.current.showToast;
      rerender();
      const secondShowToast = result.current.showToast;

      expect(firstShowToast).toBe(secondShowToast);
    });

    it('should return stable dismissToast function', () => {
      const { result, rerender } = renderHook(() => useToast());

      const firstDismissToast = result.current.dismissToast;
      rerender();
      const secondDismissToast = result.current.dismissToast;

      expect(firstDismissToast).toBe(secondDismissToast);
    });
  });
});
