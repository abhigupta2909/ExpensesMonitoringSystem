import React from 'react';
import '../styles/NumberCard.css'; // Assuming you have a CSS file for styling

function NumberCard({ title, allExpensesData, budget }) {
    const aggregateExpensesByMonth = (expenses) => {
        const totalsByMonth = {};
    
        expenses.forEach((expense) => {
            const month = expense.date.slice(0, 7); // Extract YYYY-MM format
            if (totalsByMonth[month]) {
                totalsByMonth[month] += expense.amount;
            } else {
                totalsByMonth[month] = expense.amount;
            }
        });
    
        return totalsByMonth; // Returns an object with month as key and total expense as value
    };
    

    const calculateTotalSavings = (expenses, monthlyBudget) => {
        const expensesByMonth = aggregateExpensesByMonth(expenses);
        let totalSavings = 0;
    
        Object.values(expensesByMonth).forEach(monthlyExpense => {
            totalSavings += Math.max(monthlyBudget - monthlyExpense, 0);
        });
    
        return totalSavings;
    };
    

    const totalSavings = calculateTotalSavings(allExpensesData, budget);
    const formattedSavings = `$${totalSavings.toLocaleString()}`;

    return (
        <div className="number-card">
            <h2 className="number-card-title">{title}</h2>
            <div className="number-card-number">{formattedSavings}</div>
            
        </div>
    );
}

export default NumberCard;
