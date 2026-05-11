import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FirstRunForm from '../../components/auth/FirstRunForm';

global.fetch = jest.fn();

describe('FirstRunForm', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  it('renders required fields', () => {
    render(<FirstRunForm />);
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('submits form data to /api/auth/first-run', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    const user = userEvent.setup();
    render(<FirstRunForm />);

    await user.type(screen.getByLabelText(/^name$/i), 'Akash');
    await user.type(screen.getByLabelText(/username/i), 'akash');
    await user.type(screen.getByLabelText(/email/i), 'a@e.com');
    await user.type(screen.getByLabelText(/phone/i), '9999999999');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /create admin/i }));

    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/first-run',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
