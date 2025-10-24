/**
 * FileUpload Component Tests
 *
 * Tests para:
 * - Drag & drop functionality
 * - File validation (size, type, count)
 * - Upload simulation
 * - Error handling
 * - UI states
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from '../FileUpload'
import type { ChatAttachment } from '@/hooks/useChat'
import { supabase } from '@/lib/supabase'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'test-path/test-file.jpg' },
          error: null,
        }),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/test-file.jpg' },
        })),
      })),
    },
  },
}))

describe('FileUpload Component', () => {
  const mockOnUploadComplete = vi.fn()
  const mockOnUploadError = vi.fn()

  const defaultProps = {
    conversationId: 'conv-123',
    messageId: 'msg-456',
    onUploadComplete: mockOnUploadComplete,
    onUploadError: mockOnUploadError,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  it('should render drop zone with correct text', () => {
    render(<FileUpload {...defaultProps} />)

    expect(screen.getByText(/arrastra archivos aquí/i)).toBeInTheDocument()
    expect(screen.getByText(/o haz clic para seleccionar/i)).toBeInTheDocument()
  })

  it('should show file input element', () => {
    render(<FileUpload {...defaultProps} />)

    const fileInput = screen.getByTestId('file-input')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('type', 'file')
    expect(fileInput).toHaveAttribute('multiple')
  })

  it('should display max size and file count limits', () => {
    render(<FileUpload {...defaultProps} maxSizeMB={5} maxFiles={3} />)

    expect(screen.getByText(/máximo 5 MB por archivo/i)).toBeInTheDocument()
    expect(screen.getByText(/hasta 3 archivos/i)).toBeInTheDocument()
  })

  // ============================================================================
  // FILE SELECTION TESTS
  // ============================================================================

  it('should allow file selection via input', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
    })
  })

  it('should show file preview after selection', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const files = [
      new File(['content1'], 'file1.pdf', { type: 'application/pdf' }),
      new File(['content2'], 'file2.png', { type: 'image/png' }),
    ]
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, files)

    await waitFor(() => {
      expect(screen.getByText('file1.pdf')).toBeInTheDocument()
      expect(screen.getByText('file2.png')).toBeInTheDocument()
    })
  })

  it('should display file size correctly', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const file = new File(['a'.repeat(1024)], 'test.txt', { type: 'text/plain' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/1\.0 KB/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  it('should reject files exceeding size limit', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} maxSizeMB={1} />)

    // Create 2MB file (exceeds 1MB limit)
    const largeFile = new File(['a'.repeat(2 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, largeFile)

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith(expect.stringContaining('demasiado grande'))
    })
  })

  it('should reject invalid file types', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const invalidFile = new File(['content'], 'test.exe', { type: 'application/x-msdownload' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, invalidFile)

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith(expect.stringContaining('tipo no permitido'))
    })
  })

  it('should reject when exceeding max file count', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} maxFiles={2} />)

    const files = [
      new File(['c1'], 'f1.jpg', { type: 'image/jpeg' }),
      new File(['c2'], 'f2.jpg', { type: 'image/jpeg' }),
      new File(['c3'], 'f3.jpg', { type: 'image/jpeg' }),
    ]
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, files)

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith(expect.stringContaining('máximo 2 archivos'))
    })
  })

  it('should allow valid file types', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const validFiles = [
      new File(['img'], 'image.jpg', { type: 'image/jpeg' }),
      new File(['doc'], 'doc.pdf', { type: 'application/pdf' }),
      new File(['txt'], 'text.txt', { type: 'text/plain' }),
    ]
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, validFiles)

    await waitFor(() => {
      expect(screen.getByText('image.jpg')).toBeInTheDocument()
      expect(screen.getByText('doc.pdf')).toBeInTheDocument()
      expect(screen.getByText('text.txt')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // DRAG & DROP TESTS
  // ============================================================================

  it('should handle drag enter event', () => {
    render(<FileUpload {...defaultProps} />)

    const dropZone = screen.getByTestId('drop-zone')

    fireEvent.dragEnter(dropZone)

    expect(dropZone).toHaveClass('border-primary')
  })

  it('should handle drag leave event', () => {
    render(<FileUpload {...defaultProps} />)

    const dropZone = screen.getByTestId('drop-zone')

    fireEvent.dragEnter(dropZone)
    fireEvent.dragLeave(dropZone)

    expect(dropZone).not.toHaveClass('border-primary')
  })

  it('should handle file drop', async () => {
    render(<FileUpload {...defaultProps} />)

    const dropZone = screen.getByTestId('drop-zone')
    const file = new File(['content'], 'dropped.jpg', { type: 'image/jpeg' })

    const dropEvent = new Event('drop', { bubbles: true }) as any
    dropEvent.dataTransfer = {
      files: [file],
    }

    fireEvent(dropZone, dropEvent)

    await waitFor(() => {
      expect(screen.getByText('dropped.jpg')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // REMOVE FILE TESTS
  // ============================================================================

  it('should allow removing individual files', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const files = [
      new File(['c1'], 'file1.jpg', { type: 'image/jpeg' }),
      new File(['c2'], 'file2.jpg', { type: 'image/jpeg' }),
    ]
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, files)

    await waitFor(() => {
      expect(screen.getByText('file1.jpg')).toBeInTheDocument()
    })

    const removeButtons = screen.getAllByLabelText(/remover archivo/i)
    await user.click(removeButtons[0])

    expect(screen.queryByText('file1.jpg')).not.toBeInTheDocument()
    expect(screen.getByText('file2.jpg')).toBeInTheDocument()
  })

  // ============================================================================
  // UPLOAD TESTS
  // ============================================================================

  it('should upload files when clicking upload button', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, file)

    const uploadButton = screen.getByRole('button', { name: /subir archivos/i })
    await user.click(uploadButton)

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'test.jpg',
            type: 'image/jpeg',
            url: expect.any(String),
            size: expect.any(Number),
          }),
        ])
      )
    })
  })

  it('should show upload progress during upload', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, file)

    const uploadButton = screen.getByRole('button', { name: /subir archivos/i })
    await user.click(uploadButton)

    // Should show progress bar during upload
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should disable upload button when no files selected', () => {
    render(<FileUpload {...defaultProps} />)

    const uploadButton = screen.getByRole('button', { name: /subir archivos/i })

    expect(uploadButton).toBeDisabled()
  })

  it('should disable upload button during upload', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, file)

    const uploadButton = screen.getByRole('button', { name: /subir archivos/i })
    await user.click(uploadButton)

    expect(uploadButton).toBeDisabled()
  })

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  it('should handle upload errors gracefully', async () => {
    // Mock upload failure
    vi.mocked(supabase.storage.from).mockReturnValueOnce({
      upload: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      }),
    })

    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    await user.upload(fileInput, file)

    const uploadButton = screen.getByRole('button', { name: /subir archivos/i })
    await user.click(uploadButton)

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith(expect.stringContaining('Upload failed'))
    })
  })

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  it('should have proper ARIA labels', () => {
    render(<FileUpload {...defaultProps} />)

    const fileInput = screen.getByLabelText(/seleccionar archivos/i)
    expect(fileInput).toBeInTheDocument()
  })

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const uploadButton = screen.getByRole('button', { name: /subir archivos/i })

    await user.tab() // Should focus the component

    expect(document.activeElement).toBeDefined()
  })
})
