import React, { useEffect, useState, useCallback } from 'react';
import ExpensePieChart from './PieChart';
import ExpenseScatterChart from './ScatterChart'
import ExpenseHistogram from './ExpenseHistogram';
import NumberCard from './NumberCard';
import '../styles/Dashboard.css';
import Header from './Header';

function Dashboard (){
    const [expenseData, setExpenseData] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [allExpensesData, setAllExpensesData] = useState([]);
    const [budget, setBudget] = useState(0);

    const root_endpoint = 'http://127.0.0.1:5000/';

    
    const fetchBudget = useCallback(async () => {
        const token = localStorage.getItem('token'); 
        if (!token) {
            console.error("User not authenticated");
            return;
        }
        try {
            const response = await fetch(root_endpoint + 'api/dashboard/get_budget', {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
                
            });
            const data = await response.json();
            if (response.ok) {
                setBudget(data.budget);
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching budget: " + error.message);
        }
    }, []);
    
    const fetchAllExpenses = useCallback(async () => {
        const token = localStorage.getItem('token'); 
        if (!token) {
            console.error("User not authenticated");
            return;
        }
        const url = root_endpoint + 'api/dashboard/get_all_expenses';
    
        try {
            const response = await fetch(url, { 
                method: 'GET',
                headers: {
                    'Authorization': token
                } 
            });
            const data = await response.json();
            if (response.ok) {
                setAllExpensesData(data.expenses);
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching all expenses: " + error.message);
        }
    }, []);
    
    const fetchExpenses = useCallback(async (start = '', end = '') => {
        const token = localStorage.getItem('token'); 
        if (!token) {
            console.error("User not authenticated");
            return;
        }

        let url = root_endpoint + 'api/dashboard/get_expenses';
        let queryParams = [];
    
        // Append start and end parameters if they exist
        if (start) {
            queryParams.push(`start=${encodeURIComponent(start)}`);
        }
        if (end) {
            queryParams.push(`end=${encodeURIComponent(end)}`);
        }
    
        // Join the query parameters with '&' and append to the URL
        if (queryParams.length > 0) {
            url += '?' + queryParams.join('&');
        }

        try {
            const response = await fetch(url, { 
                method: 'GET',
                headers: {
                    'Authorization': token
                } 
            });
            const data = await response.json();
            if (response.ok) {
                setExpenseData(data.expenses); // Update the state with the fetched data
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching expenses: " + error.message);
        }
    }, []);

    useEffect(() => {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth(), 1); // First day of the current month
    
        const formattedStart = start.toISOString().split('T')[0];
        const formattedEnd = end.toISOString().split('T')[0];
    
        setStartDate(formattedStart);
        setEndDate(formattedEnd);
    
        fetchExpenses(formattedStart, formattedEnd); // Fetch data for the latest month
        fetchAllExpenses();
        fetchBudget();
    }, [fetchExpenses,fetchAllExpenses,fetchBudget]);
    

    const handleDateChange = () => {
        fetchExpenses(startDate, endDate); // Fetch data for the selected date range
    };

    return (
        <div className="app-container">
            <Header productName="Dashboard"/>
            
            <div className="dashboard-container">
                
                <div className="chart-container">
                    <div className="chart-item">
                        <NumberCard 
                            title="Total Money Saved" 
                            allExpensesData={allExpensesData} 
                            budget={budget}
                        />

                    </div>
                    <div className="chart-item">
                        <ExpenseHistogram expenseData={allExpensesData} budget={budget} />
                    </div>
                    <div className="chart-item">
                        <div className="date-range-picker">
                            <label>From: </label>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                            />
                            <label>To: </label>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                            />
                            <button onClick={handleDateChange}>Select Range</button>
                        </div>
                        <div className="chart-item pie-chart-item">
                            <ExpensePieChart expenseData={expenseData} startDate={startDate} endDate={endDate} />
                        </div>
                    </div>
                    <div className="chart-item">
                        <ExpenseScatterChart expenseData={expenseData} startDate={startDate} endDate={endDate}/>
                    </div>
                    
                    
                </div>
                
            </div>
        </div>  
    );
};

export default Dashboard;