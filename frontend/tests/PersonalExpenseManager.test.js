
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import PersonalExpenseManager from '../src/components/PersonalExpenseManager';

test('renders PersonalExpenseManager component with essential elements', () => {
  const { getByText, getByPlaceholderText } = render(<PersonalExpenseManager />);
  expect(getByText('Your Budget Overview')).toBeInTheDocument();
  expect(getByPlaceholderText('Set Budget')).toBeInTheDocument();
  expect(getByText('Add or Edit Expenses')).toBeInTheDocument();
  expect(getByText('Your Expenses')).toBeInTheDocument();
});

jest.mock('../src/components/Header', () => () => <div>Header Mock</div>);
jest.mock('../src/components/ExpenseForm', () => () => <div>ExpenseForm Mock</div>);
jest.mock('../src/components/ExpenseList', () => () => <div>ExpenseList Mock</div>);

test('renders child components within PersonalExpenseManager', () => {
  const { getByText } = render(<PersonalExpenseManager />);
  expect(getByText('Header Mock')).toBeInTheDocument();
  expect(getByText('ExpenseForm Mock')).toBeInTheDocument();
  expect(getByText('ExpenseList Mock')).toBeInTheDocument();
});



const mockLocalStorage = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    clear: function() {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ budget: 1200 }),
    ok: true,
  })
);

test('updates budget on user interaction', async () => {
  const { getByText, getByPlaceholderText } = render(<PersonalExpenseManager />);

  const budgetInput = getByPlaceholderText('Set Budget');
  fireEvent.change(budgetInput, { target: { value: '1200' } });

  const updateButton = getByText(/edit/i);
  fireEvent.click(updateButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
    expect(localStorage.getItem('budget')).toBe('1200');
  });
});

test('adds an expense and fetches updated expenses', async () => {
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        json: () => Promise.resolve({}),
        ok: true,
      }))
      .mockImplementationOnce(() => Promise.resolve({
        json: () => Promise.resolve({ expenses: [{ id: 2, amount: 150, date: '2023-01-02' }] }),
        ok: true,
      }));
  
    const { getByText, getByPlaceholderText } = render(<PersonalExpenseManager />);
  
    fireEvent.change(getByPlaceholderText('Expense Amount'), { target: { value: '150' } });
    fireEvent.click(getByText('Add Expense'));
  
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
  




test('deletes an expense and updates the list', async () => {
    // Assuming initial fetch mock
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        json: () => Promise.resolve({ expenses: [{ id: 1, amount: 100, date: '2023-01-01' }] }),
        ok: true,
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
      }))
      .mockImplementationOnce(() => Promise.resolve({
        json: () => Promise.resolve({ expenses: [] }), 
        ok: true,
      }));
  
    const { getByText, queryByText } = render(<PersonalExpenseManager />);
  
    fireEvent.click(getByText('Delete Expense')); 
  
    await waitFor(() => {
      expect(queryByText('Expense amount: 100')).not.toBeInTheDocument();
    });
  });
  



test('handles budget update failure', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve({ message: 'Update failed' }),
      ok: false,
    }));
  
    const { getByText, getByPlaceholderText } = render(<PersonalExpenseManager />);
  
    const budgetInput = getByPlaceholderText('Set Budget');
    fireEvent.change(budgetInput, { target: { value: '800' } });
    fireEvent.click(getByText(/edit/i));
  
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(getByText('Update failed')).toBeInTheDocument();
    });
  });
  


test('filters and shows current month expenses', async () => {
    const currentDate = new Date();
    const currentMonthExpenses = [
      { id: 1, amount: 100, date: currentDate.toISOString() },
      { id: 2, amount: 200, date: currentDate.toISOString() }
    ];
    global.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve({ expenses: currentMonthExpenses }),
      ok: true,
    }));
  
    const { findAllByText } = render(<PersonalExpenseManager />);
  
    const expenseItems = await findAllByText(/Expense amount:/);
  
    expect(expenseItems.length).toBe(currentMonthExpenses.length);
  });
  
  test('fetches user groups on component mount', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ data: [{ id: 1, name: 'Test Group' }] }),
        ok: true,
      })
    );
  
    const { findByText } = render(<GroupManagement />);
    const groupItem = await findByText('Test Group');
  
    expect(groupItem).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1); 
  });

  test('selects a group and fetches its expenses', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ expenses: [{ id: 1, amount: 100 }] }),
        ok: true,
      })
    );
  
    const { getByText } = render(<GroupManagement />);
    fireEvent.click(getByText('Test Group'));
  
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('expenses'), expect.any(Object));
    });
  });

  test('adds an expense to a group', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ message: 'Expense added successfully' }),
        ok: true,
      })
    );
  
    const { getByText, getByPlaceholderText } = render(<GroupManagement />);
    fireEvent.change(getByPlaceholderText('Expense Amount'), { target: { value: '50' } });
    fireEvent.click(getByText('Add Expense'));
  
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(getByText('Expense added successfully')).toBeInTheDocument();
    });
  });
  

  test('edits a group expense', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ message: 'Expense edited successfully' }),
        ok: true,
      })
    );
  
    fireEvent.click(getByText('Edit Expense'));
    fireEvent.change(getByPlaceholderText('Expense Amount'), { target: { value: '75' } });
    fireEvent.click(getByText('Save Changes'));
  
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(getByText('Expense edited successfully')).toBeInTheDocument();
    });
  });

  
  test('displays payment summary for the group', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ settlements: [{ id: 1, amount: 100 }] }),
        ok: true,
      })
    );
  
    const { getByText } = render(<GroupManagement />);
    fireEvent.click(getByText('Show Payment Summary'));
  
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('settlement_summary'), expect.any(Object));
    });
  });
  