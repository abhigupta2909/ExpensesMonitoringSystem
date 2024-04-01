import React from 'react';
import { Bar } from 'react-chartjs-2';

function ExpenseHistogram({ expenseData, budget }) {
    // Function to aggregate expenses by month
    const aggregateExpensesByMonth = (data) => {
        const totalsByMonth = {};

        data.forEach((expense) => {
            const month = expense.date.slice(0, 7); // Extract YYYY-MM format
            if (totalsByMonth[month]) {
                totalsByMonth[month] += expense.amount;
            } else {
                totalsByMonth[month] = expense.amount;
            }
        });

        return Object.entries(totalsByMonth).map(([month, total]) => ({ month, total }));
    };

    // Aggregate the expense data
    const aggregatedData = aggregateExpensesByMonth(expenseData);

    // Extract months and total amounts for the chart
    const months = aggregatedData.map(item => item.month);
    const totals = aggregatedData.map(item => item.total);

    const savings = totals.map((total) => budget - total);

    const data = {
        labels: months,
        datasets: [
            {
                label: 'Total Expenses per Month',
                data: totals,
                backgroundColor: 'rgba(255, 102, 102, 0.6)',
                borderWidth: 1,
                stack: 'stack1',
            },
            {
                label: 'savings per Month',
                data: savings,
                backgroundColor: 'rgba(102, 225, 150, 0.8)', // Choose a color for the budget bars
                borderWidth: 1,
                stack: 'stack1',
            },
        ],
    };

    const options = {
        plugins: {
            title: {
                display: true,
                text: `Monthly Expense Distribution`, // Your title here
                font: {
                    size: 16, // Adjust the font size as needed
                },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Month', // Add the unit name here
                },
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Dollar ($)', // Add the unit name here
                },
            },
        },
    };

    return (
        <div>
            <Bar data={data} options={options}/>
        </div>
    );
}

export default ExpenseHistogram;
