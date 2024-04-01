import React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

function ExpenseList({ expenses, startEditExpense, deleteExpense }) {


    const sortedExpenses = [...expenses];

    return (
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc' }}>
            <table>
                <thead>
                    <tr>
                        <th>Expense Name</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th className='actions-column'>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedExpenses.map((expense) => (
                        <tr key={expense.expense_id}>
                            <td>{expense.name}</td>
                            <td>${expense.amount.toFixed(2)}</td>
                            <td>{new Date(expense.date).toLocaleDateString()}</td>
                            <td className='actions-column'>
                                <button className='editExpense-button' onClick={() => startEditExpense(expense.expense_id)}>
                                    <EditIcon style={{color:'black'}}/>
                                </button>
                                <button className='delete-button' onClick={() => deleteExpense(expense.expense_id)}>
                                    <DeleteIcon color='error'/>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ExpenseList;
