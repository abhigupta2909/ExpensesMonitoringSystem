import React, { useState, useEffect, useCallback } from 'react';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import Header from './Header';
import EditIcon from '@mui/icons-material/Edit';

function PersonalExpenseManager() {
    const [expenses, setExpenses] = useState([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const initialBudget = JSON.parse(localStorage.getItem('budget')) || 1000;
    const [editingExpense, setEditingExpense] = useState(null);
    const [budget, setBudget] = useState(initialBudget); 
    const [tempBudget, setTempBudget] = useState(budget);

    const showAlert = (message) => {
        alert(message);
    };

    const isCurrentMonth = (date) => {
        const expenseDate = new Date(date);
        const now = new Date();
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    };

    const fetchExpenses = useCallback(async () => {
        const token = localStorage.getItem('token'); 
        if (!token) {
            console.error("User not authenticated");
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/personal_expenses', {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            });

            const data = await response.json();
            if (response.ok) {
                setExpenses(data.expenses); // Assuming the API returns an array of expenses
                const currentMonthExpenses = data.expenses.filter(expense => isCurrentMonth(expense.date));
                setTotalSpent(currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0));
            } else {
                console.error(data.message);
            }
        } catch (error) {
            showAlert("Error fetching expenses: " + error.message);
        }
    }, []);



    const fetchBudget = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert("User not authenticated");
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/users/get_budget', {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            });

            const data = await response.json();
            if (response.ok) {
                setBudget(data.budget);
                setTempBudget(data.budget);
            } else {
                showAlert(data.message);
            }
        } catch (error) {
            showAlert("Error fetching budget: " + error.message);
        }
    }, []);


    useEffect(() => {
        fetchExpenses();
        fetchBudget();
    }, [fetchExpenses, fetchBudget]);

    const updateBudgetAPI = async (newBudget) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert("User not authenticated");
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/users/update_budget', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ budget: newBudget })
            });

            const data = await response.json();
            if (response.ok) {
                showAlert("Budget updated successfully");
            } else {
                showAlert(data.message);
            }
        } catch (error) {
            showAlert("Error updating budget: " + error.message);
        }
    };

    const updateBudget = () => {
        const newBudget = parseFloat(tempBudget);
        setBudget(newBudget);
        updateBudgetAPI(newBudget);
    };

    const addExpense = async (expense) => {
      // Retrieve the JWT token from local storage
      const token = localStorage.getItem('token'); 
      if (!token) {
          // Handle the case where the token is not available
          console.error("User not authenticated");
          return;
      }
  
      try {
          const response = await fetch('http://127.0.0.1:5000/api/personal_expenses/add', { 
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': token
              },
              body: JSON.stringify(expense)
          });
  
          const data = await response.json();
          if (response.ok) {
            fetchExpenses();
          } else {
              // Handle any errors returned from the server
              console.error(data.message);
          }
      } catch (error) {
          showAlert("Error fetching expenses: " + error.message);
      }
  };

  const deleteExpense = async (id) => {
    // Retrieve the JWT token from local storage
    const token = localStorage.getItem('token'); 
    if (!token) {
      // Handle the case where the token is not available
      showAlert("User not authenticated");
      return;
    }
  
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/personal_expenses/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });
  
      const data = await response.json();
      if (response.ok) {
        // Update the local state to reflect the deleted expense
        const updatedExpenses = expenses.filter(expense => expense.id !== id);
        setExpenses(updatedExpenses);
        // Recalculate the total spent after deletion
        const currentMonthExpenses = updatedExpenses.filter(expense => isCurrentMonth(expense.date));
        setTotalSpent(currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0));
        showAlert("Expense deleted successfully");
        fetchExpenses();
      } else {
        // Handle any errors returned from the server
        console.error(data.message);
        showAlert(data.message);
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      showAlert("Error deleting expense: " + error.message);
    }
  };

  const startEditExpense = (id) => {
    setEditingExpense(expenses.find(expense => expense.expense_id === id));
  };

  const editExpense = async (expenseId, updatedExpenseData) => {
    const token = localStorage.getItem('token');
    if (!token) {
        showAlert("User not authenticated");
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/personal_expenses/edit/${expenseId}`, {
            method: 'PUT',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedExpenseData)
        });

        const data = await response.json();
        if (response.ok) {
            // Replace the existing expense with the updated one in the local state
            const updatedExpenses = expenses.map(expense => {
                if (expense.id === expenseId) {
                    return { ...expense, ...updatedExpenseData };
                }
                return expense;
            });
            
            setExpenses(updatedExpenses);
            const currentMonthExpenses = updatedExpenses.filter(expense => isCurrentMonth(expense.date));
            setTotalSpent(currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0));
            showAlert("Expense updated successfully");
            setEditingExpense(null);
            fetchExpenses();
        } else {
            showAlert(data.message);
        }
    } catch (error) {
        showAlert(`Error updating expense: ${error.message}`);
    }
};


  return (
    <div className="app-container">
      <Header productName="Personal Expense Manager"/>
      <div className="section budget-section">
        <h3>Your Budget Overview</h3>

        <div className="budget-display">
            <h3 className="label">Spent: <span>${totalSpent.toFixed(2)}</span></h3>
            <h3 className="label">Remaining: <span>${(budget - totalSpent).toFixed(2)}</span></h3>
            <h3 className="label">Budget: <span>${budget.toFixed(2)}</span></h3>
            <div className="budget-update">
                <input 
                    type="number"
                    value={tempBudget}
                    onChange={e => setTempBudget(e.target.value)}
                    placeholder="Set Budget"
                    style={{height: '26px'}}
                />
                <button className='edit-budget-btn' onClick={updateBudget}>
                <EditIcon className='edit-budget-icon' fontSize='small'/>
                </button>
            </div>
          </div>              
      </div>

      <div className="section expense-form-section">
        <h3>Add or Edit Expenses</h3>
        <ExpenseForm className='expense-form'
            addExpense={addExpense} 
            editingExpense={editingExpense} 
            editExpense={editExpense} 
        />
      </div>

      <div className="section expense-list-section">
        <h3>Your Expenses</h3>
        <ExpenseList 
            expenses={expenses} 
            startEditExpense={startEditExpense}
            deleteExpense={deleteExpense} 
        />
      </div>
    </div>
);
}


export default PersonalExpenseManager;