import React from 'react';
import { Scatter } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';


function ExpenseLineChart({ expenseData, startDate, endDate }) {
    // Function to aggregate expenses by date
    const aggregateExpensesByDate = (data) => {
        const totalsByDate = {};

        data.forEach((expense) => {
            const date = expense.date;
            if (totalsByDate[date]) {
                totalsByDate[date] += expense.amount;
            } else {
                totalsByDate[date] = expense.amount;
            }
        });

        return Object.keys(totalsByDate).map(date => ({
            x: date,
            y: totalsByDate[date]
        }));
    };

    // Aggregate the expense data
    const aggregatedData = aggregateExpensesByDate(expenseData);

    const data = {
        datasets: [
            {
                label: 'Total Spending by Date',
                data: aggregatedData,
                backgroundColor: 'rgba(75, 192, 192, 1)',
                showLine: true, // Connect points with a line
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1,
            },
        ],
    };

    const options = {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day'
                },
                title: {
                    display: true,
                    text: 'Date',
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Dollar ($)',
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: `Spending trend from ${startDate} to ${endDate}`,
                font: {
                    size: 16,
                },
            },
        },
    };

    return (
        <div>
            <Scatter data={data} options={options}/>
        </div>
    );
}

export default ExpenseLineChart;
