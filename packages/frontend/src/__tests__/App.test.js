import React from 'react';
import { render, screen } from '@testing-library/react';

import App from '../App';

describe('App smoke test', () => {
  test('renders To Do App heading', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'To Do App' })).toBeInTheDocument();
  });
});
