import { render, screen } from '@testing-library/react';
import App from './App';

describe('App routing', () => {
  beforeEach(() => {
    localStorage.removeItem('token');
  });

  test('redirects unauthenticated users to the login page', async () => {
    render(<App />);
    // findBy waits for the lazy-loaded Login chunk to resolve
    expect(await screen.findByText(/welcome back to your vault/i)).toBeInTheDocument();
  });

  test('renders the ReMember brand on the login screen', async () => {
    render(<App />);
    expect(await screen.findByText('ReMember')).toBeInTheDocument();
  });
});
