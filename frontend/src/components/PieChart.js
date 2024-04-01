import React from 'react';
import 'chart.js/auto';
import { Pie } from 'react-chartjs-2';

const ExpensePieChart = ({ expenseData, startDate, endDate}) => {
    // Create an object to store category totals
    const categoryTotals = {};

    // Calculate the total spending and populate category totals
    let totalSpending = 0;
    expenseData.forEach((expense) => {
        totalSpending += expense.amount;
        if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.amount;
        } else {
            categoryTotals[expense.category] = expense.amount;
        }
    });

    // Extract category names and amounts from category totals
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    // Calculate the percentage for each category
    const percentages = amounts.map((amount) => ((amount / totalSpending) * 100).toFixed(2));

    // Create an array of labels with percentages
    //const labelsWithPercentages = categories.map((category, index) => `${category}: ${percentages[index]}%`);

    const data = {
        labels: categories,
        datasets: [
            {
                data: percentages,
                backgroundColor: [
                    // You can define different colors for each category slice here
                    'rgba(255, 99, 132, 0.6)', // Red
                    'rgba(54, 162, 235, 0.6)', // Blue
                    'rgba(255, 206, 86, 0.6)', // Yellow
                    'rgba(75, 192, 192, 0.6)', // Teal
                    'rgba(153, 102, 255, 0.6)', // Purple
                    'rgba(255, 159, 64, 0.6)', // Orange
                    'rgba(56, 220, 155, 0.6)', // Green
                    'rgba(99, 59, 144, 0.6)', // Lavender
                    'rgba(128, 64, 0, 0.6)', // Brown
                    'rgba(0, 128, 128, 0.6)', // Dark Teal
                    'rgba(46, 139, 87, 0.6)', // Sea Green
                    'rgba(255, 99, 71, 0.6)', // Tomato Red
                    // Add more colors as needed
                ],
            },
        ],
    };

    const options = {
        maintainAspectRatio: true,
        plugins: {
            title: {
                display: true,
                text: `Expense Categories (from ${startDate} to ${endDate})`, // Your title here
                font: {
                    size: 16, // Adjust the font size as needed
                },
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label;
                        const percentage = context.raw + '%'; // 'context.raw' will have the percentage value
                        return label + ': ' + percentage;
                    }
                },
            },
        },
    };
    

    return <Pie data={data} options={options} />;
};

export default ExpensePieChart;
