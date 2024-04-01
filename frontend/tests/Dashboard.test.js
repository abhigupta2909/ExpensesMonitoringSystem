import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';

const localStorageMock = {
  getItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ expenses: [], budget: 0 }),
      ok: true,
    })
  );
});

test('renders Dashboard component', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Money Saved')).toBeInTheDocument();
    expect(screen.getByText('Expense Overview')).toBeInTheDocument(); 
    expect(screen.getByText('Spending Pattern')).toBeInTheDocument(); 
  });
  

test('fetches data on component mount', async () => {
    render(<Dashboard />);
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api/dashboard/get_budget'), expect.any(Object));
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api/dashboard/get_all_expenses'), expect.any(Object));
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api/dashboard/get_expenses'), expect.any(Object));
    });
});
  

test('date range change triggers data fetch', async () => {
    render(<Dashboard />);
    const startDateInput = screen.getByLabelText('From:');
    const endDateInput = screen.getByLabelText('To:');
    fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2023-01-31' } });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(5); 
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api/dashboard/get_expenses?start=2023-01-01&end=2023-01-31'), expect.any(Object));
    });
  });

test('handles fetch error', async () => {
  global.fetch.mockImplementationOnce(() => Promise.reject(new Error('API down')));
  console.error = jest.fn();

  render(<Dashboard />);
  await waitFor(() => {
    expect(console.error).toHaveBeenCalledWith(expect.any(String));
  });
});

test('displays fetched budget and expenses data', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ expenses: [{ amount: 50 }, { amount: 100 }], budget: 500 }),
        ok: true,
      })
    );
  
    render(<Dashboard />);
  
    await waitFor(() => {
      expect(screen.getByText('Total Money Saved')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument(); 
      expect(screen.getByText('Total Expenses')).toBeInTheDocument(); 
      expect(screen.getByText('150')).toBeInTheDocument(); 
    });
  });
  
test('initial state of start and end dates', () => {
    render(<Dashboard />);
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    expect(screen.getByLabelText('From:').value).toBe(startOfMonth);
    expect(screen.getByLabelText('To:').value).toBe(today);
});


  
test('renders all child components', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Money Saved')).toBeInTheDocument();
    expect(screen.getByTestId('expense-pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('expense-scatter-chart')).toBeInTheDocument();
    expect(screen.getByTestId('expense-histogram')).toBeInTheDocument(); 
    expect(screen.getByTestId('number-card')).toBeInTheDocument();
});


test('displays no data message when there are no expenses', () => {
    global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
        json: () => Promise.resolve({ expenses: [], budget: 0 }),
        ok: true,
    })
    );

    render(<Dashboard />);
    expect(screen.getByText('No expenses to display')).toBeInTheDocument();
});


test('handles unauthorized access', () => {
    localStorageMock.getItem.mockImplementationOnce(() => null); 
    render(<Dashboard />);
    expect(screen.getByText('User not authenticated')).toBeInTheDocument();
});

test('updates budget when new data is fetched', async () => {
    global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
        json: () => Promise.resolve({ expenses: [{ amount: 100 }], budget: 1000 }),
        ok: true,
    })
    );

    render(<Dashboard />);
    await waitFor(() => {
    expect(screen.getByText('Budget: $1000')).toBeInTheDocument();
    });
});

test('displays error when fetching budget fails', async () => {
    global.fetch.mockImplementationOnce(() =>
    Promise.reject(new Error('Failed to fetch budget'))
    );

    render(<Dashboard />);
    await waitFor(() => {
    expect(screen.getByText('Failed to fetch budget')).toBeInTheDocument();
    });
});
  

test('passes correct data to ExpensePieChart', async () => {
    const expenseData = [{ category: 'Food', amount: 50 }, { category: 'Transport', amount: 100 }];
    global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
        json: () => Promise.resolve({ expenses: expenseData, budget: 500 }),
        ok: true,
    })
    );

    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('Transport')).toBeInTheDocument();
    
    });
});


test('successful date range selection updates state and fetches data', async () => {
    render(<Dashboard />);
    const startDateInput = screen.getByLabelText('From:');
    const endDateInput = screen.getByLabelText('To:');
    fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2023-01-31' } });

    await waitFor(() => {
    expect(screen.getByLabelText('From:').value).toBe('2023-01-01');
    expect(screen.getByLabelText('To:').value).toBe('2023-01-31');
    expect(global.fetch).toHaveBeenCalled(); 
    });
});

test('handles invalid date range selection', () => {
    render(<Dashboard />);
    fireEvent.change(screen.getByLabelText('From:'), { target: { value: '2023-01-31' } });
    fireEvent.change(screen.getByLabelText('To:'), { target: { value: '2023-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Select Range' }));
    expect(screen.getByText('Invalid date range')).toBeInTheDocument();
});
  

test('renders the Header component', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('header-component')).toBeInTheDocument();
});

test('visibility of charts based on data availability', async () => {
    global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
        json: () => Promise.resolve({ expenses: [], budget: 500 }), 
        ok: true,
    })
    );

    render(<Dashboard />);
    await waitFor(() => {
    expect(screen.queryByTestId('expense-pie-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('expense-scatter-chart')).not.toBeInTheDocument();
    });
});
  
  