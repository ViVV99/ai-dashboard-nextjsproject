import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setUserStatusAction } from './actions';
import { ana, caio } from './fixtures';
import { StatusDialog } from './status-dialog';

vi.mock('./actions', () => ({ setUserStatusAction: vi.fn() }));
const setStatus = vi.mocked(setUserStatusAction);

beforeEach(() => {
  vi.clearAllMocks();
  setStatus.mockResolvedValue({ ok: true });
});

describe('StatusDialog', () => {
  it('pede confirmação antes de bloquear e explica o efeito', async () => {
    const onDone = vi.fn();
    render(<StatusDialog user={ana} onClose={vi.fn()} onDone={onDone} />);

    expect(screen.getByRole('dialog', { name: 'Bloquear Ana Lima?' })).toHaveTextContent(
      'perde o acesso',
    );
    expect(setStatus).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Bloquear' }));

    expect(setStatus).toHaveBeenCalledWith({ id: 7, status: 'blocked' });
    expect(onDone).toHaveBeenCalledWith('Acesso de Ana Lima bloqueado.');
  });

  it('cancelar não chama a action', async () => {
    const onClose = vi.fn();
    render(<StatusDialog user={ana} onClose={onClose} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
    expect(setStatus).not.toHaveBeenCalled();
  });

  it('bloqueado → desbloquear', async () => {
    const onDone = vi.fn();
    render(<StatusDialog user={caio} onClose={vi.fn()} onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: 'Desbloquear' }));

    expect(setStatus).toHaveBeenCalledWith({ id: 8, status: 'active' });
    expect(onDone).toHaveBeenCalledWith('Acesso de Caio liberado.');
  });

  it('erro da action aparece no diálogo', async () => {
    setStatus.mockResolvedValue({ ok: false, error: 'Você não tem permissão para esta ação.' });
    render(<StatusDialog user={ana} onClose={vi.fn()} onDone={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Bloquear' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Você não tem permissão');
  });
});
