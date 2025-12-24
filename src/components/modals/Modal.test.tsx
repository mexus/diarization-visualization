import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal, ModalButton } from './Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });
  });

  describe('title and icon', () => {
    it('should render title when provided', () => {
      render(<Modal {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      render(
        <Modal {...defaultProps} icon={<span data-testid="test-icon">Icon</span>} />
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('should not render header when no title, icon, or close button', () => {
      render(
        <Modal {...defaultProps} showCloseButton={false}>
          <div data-testid="content">Content</div>
        </Modal>
      );
      // Header element should not be present
      const content = screen.getByTestId('content');
      expect(content.parentElement?.querySelector('h2')).toBeNull();
    });
  });

  describe('close button', () => {
    it('should show close button by default', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('should hide close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(<Modal {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Close'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('backdrop click', () => {
    it('should close on backdrop click by default', () => {
      render(<Modal {...defaultProps} />);
      // Click on the backdrop (the outer fixed div)
      const backdrop = screen.getByText('Modal content').parentElement?.parentElement;
      fireEvent.click(backdrop!);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on backdrop click when closeOnBackdropClick is false', () => {
      render(<Modal {...defaultProps} closeOnBackdropClick={false} />);
      const backdrop = screen.getByText('Modal content').parentElement?.parentElement;
      fireEvent.click(backdrop!);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should not close when clicking inside the modal', () => {
      render(<Modal {...defaultProps} />);
      fireEvent.click(screen.getByText('Modal content'));
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('escape key', () => {
    afterEach(() => {
      // Clean up any event listeners
    });

    it('should close on escape key by default', () => {
      render(<Modal {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on escape key when closeOnEscape is false', () => {
      render(<Modal {...defaultProps} closeOnEscape={false} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('enter key', () => {
    it('should call onEnter when enter key is pressed', () => {
      const onEnter = vi.fn();
      render(<Modal {...defaultProps} onEnter={onEnter} />);
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onEnter).toHaveBeenCalledTimes(1);
    });

    it('should not call onEnter when not provided', () => {
      render(<Modal {...defaultProps} />);
      // Should not throw
      expect(() => fireEvent.keyDown(document, { key: 'Enter' })).not.toThrow();
    });
  });

  describe('footer', () => {
    it('should render footer when provided', () => {
      render(
        <Modal {...defaultProps} footer={<button>Confirm</button>} />
      );
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('should not render footer container when not provided', () => {
      const { container } = render(<Modal {...defaultProps} />);
      // Footer would have mt-6 class
      expect(container.querySelector('.mt-6')).toBeNull();
    });
  });

  describe('sizes', () => {
    it('should apply sm size class', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const modal = screen.getByText('Modal content').parentElement;
      expect(modal).toHaveClass('max-w-sm');
    });

    it('should apply md size class by default', () => {
      render(<Modal {...defaultProps} />);
      const modal = screen.getByText('Modal content').parentElement;
      expect(modal).toHaveClass('max-w-md');
    });

    it('should apply lg size class', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const modal = screen.getByText('Modal content').parentElement;
      expect(modal).toHaveClass('max-w-lg');
    });

    it('should apply xl size class', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const modal = screen.getByText('Modal content').parentElement;
      expect(modal).toHaveClass('max-w-2xl');
    });
  });

  describe('icon variants', () => {
    it('should apply blue icon background by default', () => {
      render(
        <Modal {...defaultProps} icon={<span>Icon</span>} />
      );
      const iconContainer = screen.getByText('Icon').parentElement;
      expect(iconContainer).toHaveClass('bg-blue-100');
    });

    it('should apply red icon background', () => {
      render(
        <Modal {...defaultProps} icon={<span>Icon</span>} iconVariant="red" />
      );
      const iconContainer = screen.getByText('Icon').parentElement;
      expect(iconContainer).toHaveClass('bg-red-100');
    });

    it('should apply amber icon background', () => {
      render(
        <Modal {...defaultProps} icon={<span>Icon</span>} iconVariant="amber" />
      );
      const iconContainer = screen.getByText('Icon').parentElement;
      expect(iconContainer).toHaveClass('bg-amber-100');
    });

    it('should apply green icon background', () => {
      render(
        <Modal {...defaultProps} icon={<span>Icon</span>} iconVariant="green" />
      );
      const iconContainer = screen.getByText('Icon').parentElement;
      expect(iconContainer).toHaveClass('bg-green-100');
    });
  });
});

describe('ModalButton', () => {
  it('should render with secondary variant by default', () => {
    render(<ModalButton onClick={vi.fn()}>Cancel</ModalButton>);
    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button).toHaveClass('bg-gray-100');
  });

  it('should render with primary variant', () => {
    render(<ModalButton onClick={vi.fn()} variant="primary">Confirm</ModalButton>);
    const button = screen.getByRole('button', { name: 'Confirm' });
    expect(button).toHaveClass('bg-blue-500');
  });

  it('should render with danger variant', () => {
    render(<ModalButton onClick={vi.fn()} variant="danger">Delete</ModalButton>);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('bg-red-500');
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ModalButton onClick={onClick}>Click me</ModalButton>);
    fireEvent.click(screen.getByRole('button', { name: 'Click me' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
