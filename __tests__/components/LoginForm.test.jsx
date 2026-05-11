import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../components/auth/LoginForm';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock the first-run-status check so component doesn't redirect during tests
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: async () => ({ isFirstRun: false }) })
  );
});

const { signIn } = require('next-auth/react');

describe('LoginForm', () => {
  beforeEach(() => signIn.mockReset());

  it('shows Doctor fields by default (username + password)', async () => {
    render(<LoginForm />);
    expect(await screen.findByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it('switches to Patient fields (email + password) when toggled', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(await screen.findByRole('button', { name: /patient/i }));
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
  });

  it('calls signIn with doctor provider on doctor submit', async () => {
    signIn.mockResolvedValueOnce({ ok: true, error: null });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(await screen.findByLabelText(/username/i), 'akash');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(signIn).toHaveBeenCalledWith('doctor', expect.objectContaining({
      username: 'akash',
      password: 'secret',
      redirect: false,
    }));
  });

  it('calls signIn with patient provider after toggle', async () => {
    signIn.mockResolvedValueOnce({ ok: true, error: null });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(await screen.findByRole('button', { name: /patient/i }));
    await user.type(screen.getByLabelText(/email/i), 'p@e.com');
    await user.type(screen.getByLabelText(/password/i), 'pw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(signIn).toHaveBeenCalledWith('patient', expect.objectContaining({
      email: 'p@e.com',
      password: 'pw',
      redirect: false,
    }));
  });
});
