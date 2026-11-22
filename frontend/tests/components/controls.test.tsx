import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncidentCard, SeverityBadge } from '@/components/shared/incidents';
import { FilterBar } from '@/components/shared/filter-bar';
import { IncidentTable } from '@/features/incidents/incident-table';
import { ReplayControls } from '@/features/replay/replay-page';
import { mockIncidents } from '../fixtures/mock-data';
describe('domain components', () => {
  it('communicates severity with text, not color alone', () => {
    render(<SeverityBadge severity="Critical" />);
    expect(screen.getByText('Critical')).toBeVisible();
  });
  it('selects incident and shows evidence separately', async () => {
    const onSelect = vi.fn();
    render(<IncidentCard incident={mockIncidents[0]} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockIncidents[0]);
    expect(screen.getByText('Corroborated')).toBeVisible();
  });
  it('emits category filters and resets', async () => {
    const onChange = vi.fn();
    render(<FilterBar incidents={mockIncidents} filters={{}} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Flood');
    expect(onChange).toHaveBeenCalledWith({ categories: ['Flood'] });
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onChange).toHaveBeenLastCalledWith({});
  });
  it('supports playback, pause, reset, and speed selection', async () => {
    const onPlay = vi.fn(),
      onPause = vi.fn(),
      onReset = vi.fn(),
      onSpeed = vi.fn();
    const props = { onPlay, onPause, onReset, onSpeed, speed: 600 };
    const { rerender } = render(<ReplayControls {...props} status="ready" />);
    await userEvent.click(screen.getByRole('button', { name: /Start replay/ }));
    expect(onPlay).toHaveBeenCalledOnce();
    await userEvent.selectOptions(screen.getByLabelText('Replay speed'), '3600');
    expect(onSpeed).toHaveBeenCalledWith(3600);
    rerender(<ReplayControls {...props} status="playing" />);
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(onPause).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByLabelText('Reset replay'));
    expect(onReset).toHaveBeenCalledOnce();
  });
  it('paginates and selects visible table rows', async () => {
    render(<IncidentTable incidents={mockIncidents} />);
    expect(screen.getAllByRole('row')).toHaveLength(9);
    await userEvent.click(screen.getByLabelText('Select all visible rows'));
    expect(screen.getByText(/8 selected/)).toBeVisible();
    await userEvent.click(screen.getByLabelText('Next page'));
    expect(screen.getByText('Page 2 of 3')).toBeVisible();
  });
});
