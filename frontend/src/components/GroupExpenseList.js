import React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import '../styles/GroupExpenseList.css'

function GroupExpenseList({ groupExpenses, startEditGroupExpense, deleteGroupExpense }) {

    // Format split details for display
    const formatSplitDetails = (splitDetails) => {
        let formattedShares = '';
        if (splitDetails && splitDetails.shares) {
            formattedShares = Object.entries(splitDetails.shares)
                .map(([username, share]) => {
                    // Format to two decimal places if the share is a decimal
                    const formattedShare = share % 1 === 0 ? share : share.toFixed(2);
                    return `${username}: ${formattedShare}%`;
                })
                .join(', ');
        }
        return `${formattedShares}`;
    };

    // Sort expenses by date in descending order
    const sortedGroupExpenses = [...groupExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="scrollable-table-container" style={{    
            maxHeight: '300px', 
            overflowY: 'auto', 
            overflowX: 'auto'
        }}>
            <div className="group-table-responsive" style={{    
                maxHeight: '300px', 
                overflowY: 'auto', 
                overflowX: 'auto',
                border: '1px solid #ccc'
            }}>
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Paid By</th>
                            <th>Paid For</th>
                            <th>Date</th>
                            <th>Split Method</th>
                            <th>Split Details</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedGroupExpenses.map((expense) => (
                            <tr key={expense.group_expense_id}>
                                <td>{expense.description}</td>
                                <td>${expense.amount.toFixed(2)}</td>
                                <td>{expense.paid_by}</td>
                                <td className="scrollable-cell">{expense.paid_for.join(', ')}</td>
                                <td>{new Date(expense.date).toLocaleDateString()}</td>
                                <td>{expense.split_method}</td>
                                <td className="scrollable-cell">{formatSplitDetails(expense.split_details)}</td>
                                <td className='actions-column'>
                                    <button className='editExpense-button' onClick={() => startEditGroupExpense(expense.group_expense_id)}>
                                        <EditIcon style={{color: 'black'}}/>
                                    </button>
                                    <button className='delete-button' onClick={() => deleteGroupExpense(expense.group_expense_id)}>
                                        <DeleteIcon color='error'/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

    );
}

export default GroupExpenseList;
