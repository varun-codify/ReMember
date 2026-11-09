import { render, screen } from '@testing-library/react';
import App from './App';

describe('App routing', () => {
  beforeEach(() => {
    localStorage.removeItem('token');
    window.history.pushState({}, '', '/');
  });

  test('shows the landing page at / for unauthenticated users', async () => {
    render(<App />);
    // findBy waits for the lazy-loaded Landing chunk to resolve
    expect(await screen.findByText(/never forget anything important/i)).toBeInTheDocument();
  });

  test('redirects unauthenticated users from /dashboard to the login page', async () => {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    expect(await screen.findByText(/welcome back to your vault/i)).toBeInTheDocument();
  });

  test('renders the ReMember brand on the login screen', async () => {
    window.history.pushState({}, '', '/login');
    render(<App />);
    expect(await screen.findByText('ReMember')).toBeInTheDocument();
  });
});
