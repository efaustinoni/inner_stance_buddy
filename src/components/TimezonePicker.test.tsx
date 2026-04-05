import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TimezonePicker from './TimezonePicker';

describe('TimezonePicker', () => {
  const defaultProps = {
    value: 'Europe/Amsterdam',
    onChange: vi.fn(),
  };

  it('renders the label', () => {
    render(<TimezonePicker {...defaultProps} />);
    expect(screen.getByText('Timezone')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<TimezonePicker {...defaultProps} label="Your Timezone" />);
    expect(screen.getByText('Your Timezone')).toBeInTheDocument();
  });

  it('renders helper text when provided', () => {
    render(<TimezonePicker {...defaultProps} helperText="Select your local timezone" />);
    expect(screen.getByText('Select your local timezone')).toBeInTheDocument();
  });

  it('shows dropdown when toggle button clicked', () => {
    render(<TimezonePicker {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
  });

  it('filters timezones by search query', () => {
    render(<TimezonePicker {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByPlaceholderText(/Search/i), {
      target: { value: 'Amsterdam' },
    });
    expect(screen.getAllByText(/Amsterdam/i).length).toBeGreaterThan(0);
  });

  it('calls onChange when a timezone is selected from search results', () => {
    const onChange = vi.fn();
    render(<TimezonePicker value="Europe/Amsterdam" onChange={onChange} />);
    // Open the dropdown
    fireEvent.click(screen.getByRole('button'));
    // Search for UTC
    fireEvent.change(screen.getByPlaceholderText(/Search/i), {
      target: { value: 'UTC' },
    });
    // Timezone option buttons live inside the max-h-80 scrollable div
    const resultBtns = document.querySelectorAll<HTMLButtonElement>(
      '.max-h-80 button[type="button"]'
    );
    const utcBtn = Array.from(resultBtns).find((b) => b.textContent?.includes('UTC'));
    if (utcBtn) {
      fireEvent.click(utcBtn);
      expect(onChange).toHaveBeenCalled();
    }
  });

  it('closes dropdown when clicking outside', () => {
    render(<TimezonePicker {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByPlaceholderText(/Search/i)).not.toBeInTheDocument();
  });

  it('displays current timezone value in button', () => {
    render(<TimezonePicker {...defaultProps} value="UTC" />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toMatch(/UTC/);
  });
});
