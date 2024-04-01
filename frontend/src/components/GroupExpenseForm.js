import React, { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import '../styles/ExpenseForm.css';
import '../styles/GroupExpenseForm.css';

function GroupExpenseForm({ selectedGroup, groupMembers, addGroupExpense, editingExpense, editGroupExpense, cancelEdit}) {
    const [amount, setAmount] = useState(editingExpense ? editingExpense.amount : '');
    const [description, setDescription] = useState(editingExpense ? editingExpense.description : ''); // Added description state
    const [date, setDate] = useState(editingExpense ? editingExpense.date : '');
    const [splitMethod, setSplitMethod] = useState(editingExpense ? editingExpense.splitMethod : 'equal');
    const [paidFor, setPaidFor] = useState({});
    const [splitDetails, setSplitDetails] = useState({ payer: '', amount: 0, shares: {} });
    const [payer, setPayer] = useState('');

    useEffect(() => {
        if (editingExpense && groupMembers.length > 0) {

            // Set basic fields
            setAmount(editingExpense.amount.toString());
            setDescription(editingExpense.description);
            setDate(new Date(editingExpense.date).toISOString().split('T')[0]);
            setSplitMethod(editingExpense.splitMethod);
    
            // Map the username to user_id for paid_by
            const payerId = groupMembers.find(member => member.username === editingExpense.paid_by)?.user_id || '';
            setPayer(payerId);
    
            // Map usernames to user_ids for paid_for
            const paidForState = groupMembers.reduce((acc, member) => {
                acc[member.user_id] = editingExpense.paid_for.includes(member.username);
                return acc;
            }, {});
            setPaidFor(paidForState);
    
            // Set splitDetails using the payerId and ensuring shares use user_ids
            const updatedSplitDetails = {
                payer: payerId,
                amount: editingExpense.split_details.amount,
                shares: {}
            };
    
            // Map usernames in shares to user_ids
            Object.entries(editingExpense.split_details.shares).forEach(([username, share]) => {
                const userId = groupMembers.find(member => member.username === username)?.user_id || '';
                updatedSplitDetails.shares[userId] = share;
            });
    
            setSplitDetails(updatedSplitDetails);

        }
    }, [groupMembers, editingExpense]);
    

    const handlePaidForChange = (memberId, isRadio) => {
        if (isRadio) {
            // For radio buttons, set the selected member as the only one marked in 'Paid For'
            setPaidFor({ [memberId]: true });
        } else {
            // For checkboxes, toggle the check state
            setPaidFor(prevPaidFor => ({
                ...prevPaidFor,
                [memberId]: !prevPaidFor[memberId]
            }));
        }
    };

    const handlePayerChange = (payerId) => {
        setSplitDetails(prevDetails => ({ ...prevDetails, payer: payerId }));
    };
    
    const handleAmountChange = (amount) => {
        setSplitDetails(prevDetails => ({ ...prevDetails, amount: parseFloat(amount) }));
    };
    
    const handleShareChange = (memberId, share) => {
        setSplitDetails(prevDetails => ({
            ...prevDetails,
            shares: { ...prevDetails.shares, [memberId]: parseFloat(share) }
        }));
    };

    const calculateEqualSplit = () => {
        const equalShare = 100 / groupMembers.length;
        const shares = groupMembers.reduce((acc, member) => {
            acc[member.user_id] = equalShare;
            return acc;
        }, {});
        return {
            payer: splitDetails.payer,
            amount: amount,
            shares: shares,
        };
    };

    const calculatePaymentSplit = () => {
        // Find the member who is marked as 'Paid For'
        const paidForMemberId = Object.keys(paidFor).find(memberId => paidFor[memberId]);
    
        if (!paidForMemberId) {
            throw new Error("Please select a member in 'Paid For'.");
        }
    
        // Set the shares to 100% for the selected member
        const shares = { [paidForMemberId]: 100 };
    
        return {
            payer: payer,
            amount: parseFloat(amount),
            shares: shares
        };
    };

    const handlePercentageChange = (memberId, percentage) => {
        setSplitDetails(prevDetails => ({
            ...prevDetails,
            shares: { ...prevDetails.shares, [memberId]: parseFloat(percentage) || 0 }
        }));
    };

    const handleCustomAmountChange = (memberId, amount) => {
        // Ensures the value is not negative
        const validAmount = Math.max(0, parseFloat(amount) || 0); 
        setSplitDetails(prevDetails => ({
            ...prevDetails,
            shares: { ...prevDetails.shares, [memberId]: validAmount }
        }));
    };
    

    const calculatePercentageSplit = () => {
        const totalPercentage = Object.values(splitDetails.shares).reduce((acc, share) => acc + share, 0);
        if (totalPercentage !== 100) {
            alert("The sum of percentage shares must equal 100.");
            return;
        }
        return {
            payer: payer,
            amount: parseFloat(amount),
            shares: splitDetails.shares,
        };
    };
    
    const calculateCustomSplit = () => {
        const totalAmount = parseFloat(amount);
        if (totalAmount <= 0) {
            alert("Please enter a valid total amount.");
            return;
        }
    
        const shares = Object.fromEntries(
            Object.entries(splitDetails.shares).map(([memberId, memberAmount]) => {
                return [memberId, (memberAmount / totalAmount) * 100];
            })
        );
        // Check if the sum of split amounts equals the total amount
        const totalSplitAmount = Object.values(shares).reduce((acc, percentage) => acc + (percentage / 100) * totalAmount, 0);
        if (totalSplitAmount.toFixed(2) !== totalAmount.toFixed(2)) {
            alert("The sum of individual amounts must equal the total amount.");
            return;
        }
    
        return {
            payer: payer,
            amount: totalAmount,
            shares: shares
        };
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!payer) {
            alert("Please select who paid for the expense.");
            return;
        }
        const paidForMemberIds = Object.entries(paidFor)
        .filter(([memberId, isPaid]) => isPaid)
        .map(([memberId]) => memberId);

        let expenseSplitDetails;
        try {
            switch (splitMethod) {
                case 'percentage':
                    expenseSplitDetails = calculatePercentageSplit();
                    break;
                case 'custom':
                    expenseSplitDetails = calculateCustomSplit();
                    break;
                case 'payment':
                    expenseSplitDetails = calculatePaymentSplit();
                    break;
                default:
                    expenseSplitDetails = calculateEqualSplit();
                    break;
            }
        } catch (error) {
            alert(error.message); 
            return; 
        }
        const currentExpense = {
            groupId: selectedGroup,
            amount: parseFloat(amount),
            description,
            paid_by: payer,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            splitMethod,
            splitDetails: {
                ...expenseSplitDetails,
                payer: payer,
            },
            paidFor: paidForMemberIds,
        };
        
        if (editingExpense) {
            // Call edit function if editing
            editGroupExpense(editingExpense.group_expense_id, currentExpense); 
        } else {
            // Call add function if not editing
            addGroupExpense(currentExpense); 
        }


        // clearing the form
        clearForm();
    };

    const clearForm = () => {
        // Clearing the form fields and resetting state
        setAmount('');
        setDescription('');
        setDate('');
        setSplitMethod('equal');
        setPaidFor({});
        setPayer('');

        const resetShares = groupMembers.reduce((acc, member) => {
            // Reset share to empty for each member
            acc[member.user_id] = ''; 
            return acc;
        }, {});
    
        setSplitDetails({ payer: '', amount: 0, shares: resetShares });
        // Call the function passed from the parent to cancel editing
        cancelEdit(); 
    };
    
    const handleCancelEdit = () => {
        // Reset the form and clear the editing state
        clearForm();
    };


    return (
        <form className='expense-form-fields' onSubmit={handleSubmit}>
            <div className="form-content">
                <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder="Amount"
                    required
                />
                <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    required
                />
                <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                />
                <fieldset className="split-method">
                    <legend>Split Method</legend>
                    <select 
                        value={splitMethod} 
                        onChange={(e) => setSplitMethod(e.target.value)}
                        id="splitMethodSelect"
                    >
                        <option value="equal">Equal</option>
                        <option value="percentage">Percentage</option>
                        <option value="custom">Custom</option>
                        <option value="payment">Payment</option>

                    </select>
                </fieldset>
                <fieldset className="payer-fieldset">
                    <legend>Paid By</legend>
                    <select 
                        className="custom-select" 
                        value={payer} 
                        onChange={(e) => setPayer(e.target.value)}
                    >
                        <option value="">Select</option>
                        {groupMembers.map(member => (
                            <option key={member.user_id} 
                                value={member.user_id}
                            >
                            {`${member.username} (${member.email})`}
                            </option>
                        ))}
                    </select>
                </fieldset>

                <fieldset className="members-fieldset">
                    <legend>Paid For</legend>
                    <ul>
                        {groupMembers.map(member => (
                            <li key={member.user_id}>
                                <label>
                                    <input
                                        type={splitMethod === 'payment' ? 'radio' : 'checkbox'}
                                        name="paidFor"
                                        value={member.user_id}
                                        checked={!!paidFor[member.user_id]}
                                        onChange={() => handlePaidForChange(member.user_id, splitMethod === 'payment')}
                                    />
                                    {`${member.username} (${member.email})`}
                                    {splitMethod === 'percentage' && (
                                        <input
                                            type="number"
                                            placeholder="%"
                                            value={splitDetails.shares[member.user_id] || ''}
                                            onChange={(e) => handlePercentageChange(member.user_id, e.target.value)}
                                            style={{ marginLeft: '10px', width: '50px' }}
                                        />
                                    )}
                                    {splitMethod === 'custom' && (
                                        <input
                                            type="number"
                                            placeholder="$"
                                            value={splitDetails.shares[member.user_id] || ''}
                                            onChange={(e) => handleCustomAmountChange(member.user_id, e.target.value)}
                                            style={{ marginLeft: '10px', width: '50px' }}
                                        />
                                    )}
                                </label>
                            </li>
                        ))}
                    </ul>
                </fieldset>
                <div className="form-actions">
                    <button type="submit">
                        {editingExpense ? <EditIcon /> : <AddIcon />}
                    </button>
                    {editingExpense && (
                        <button type="button" onClick={handleCancelEdit}>
                            <CancelIcon />
                        </button>
                    )}
                </div>
                
            </div>
        </form>
    );
}

export default GroupExpenseForm;
