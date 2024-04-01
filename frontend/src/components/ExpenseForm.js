import React, { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import '../styles/ExpenseForm.css';

function ExpenseForm({ addExpense, editingExpense, editExpense }) {
    const [name, setName] = useState(editingExpense ? editingExpense.name : '');
    const [amount, setCost] = useState(editingExpense ? editingExpense.amount : '');
    const [date, setDate] = useState(editingExpense ? editingExpense.date : '');
    const [category, setCategory] = useState(editingExpense ? editingExpense.category : '');

    const expenseCategories = [
        "Housing",
        "Utilities",
        "Food and Groceries",
        "Transportation",
        "Healthcare",
        "Insurance",
        "Debt Payments",
        "Savings and Investments",
        "Education",
        "Childcare and Children's Education",
        "Personal Care",
        "Entertainment and Recreation",
        "Gifts and Donations",
        "Household Goods and Supplies",
        "Pet Care",
        "Miscellaneous",
        "Technology",
        "Taxes",
        "Others"
    ];
    
    const handleSubmit = (e) => {
        e.preventDefault();
    
        let currentDate = new Date();
        let formattedDate = date;
    
        if (formattedDate) {
            // Parse the selected date
            const parsedDate = new Date(formattedDate);
    
            // Combine the selected date with the current time
            parsedDate.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds());
    
            // Convert back to ISO string with time
            formattedDate = parsedDate.toISOString();
        } else {
            // Use the current date and time if no date is provided
            formattedDate = currentDate.toISOString();
        }
        
        const currentExpense = { name, amount: parseFloat(amount), date: formattedDate, category };
    
        if (editingExpense) {
            editExpense(editingExpense.expense_id, currentExpense);
        } else {
            addExpense(currentExpense);
        }
    
        // Reset form fields
        setName('');
        setCost('');
        setDate('');
    };

    useEffect(() => {
        if (editingExpense) {
            setName(editingExpense.name);
            setCost(editingExpense.amount);
            setDate(editingExpense.date);
            setCategory(editingExpense.category);
        }
    }, [editingExpense]);

    return (
        <form className='expense-form-fields' onSubmit={handleSubmit}>
            <div className="form-content">
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Expense Name"
                    required
                />
                <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setCost(e.target.value)} 
                    placeholder="Amount"
                    required
                />
                <select value={category} onChange={e => setCategory(e.target.value)} required>
                    <option value="">Select Category</option>
                    {expenseCategories.map((cat, index) => (
                        <option key={index} value={cat}>{cat}</option>
                    ))}
                </select>
                <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                />
                <button type="submit">
                    {editingExpense ? <><EditIcon /></> : <><AddIcon /></>}
                </button>
            </div>
        </form>

    );
}

export default ExpenseForm;
