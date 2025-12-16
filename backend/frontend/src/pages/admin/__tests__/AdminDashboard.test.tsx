import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import { AppProvider } from '../../../contexts/AppContext';
import { AdminDashboard } from '../AdminDashboard';

// Mock the API calls
vi.mock('../../../services/api', () => ({
  exerciseAPI: {
    getExercises: vi.fn().mockResolvedValue([]),
  },
  statisticsAPI: {
    getRankings: vi.fn().mockResolvedValue([]),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          {component}
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminDashboard', () => {
  it('renders the dashboard title', async () => {
    renderWithProviders(<AdminDashboard />);
    
    // Check if the welcome message appears
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  it('displays loading spinner initially', () => {
    renderWithProviders(<AdminDashboard />);
    
    // Should show loading spinner while data is being fetched
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});