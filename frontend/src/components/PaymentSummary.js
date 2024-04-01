import React, { useState } from 'react';
import '../styles/PaymentSummary.css';

const PaymentSummary = ({ paymentSummary, currentUser }) => {
    const [selectedSettlements, setSelectedSettlements] = useState({});

    const handleCheckboxChange = (index, isChecked) => {
        setSelectedSettlements(prev => ({ ...prev, [index]: isChecked }));
    };
    const hasSettlements = Array.isArray(paymentSummary) && paymentSummary.length > 0;

    const handleSubmit = async () => {
        // Gather the ids of the settlements that were checked
        const settlementsToSubmit = Object.entries(selectedSettlements)
            .filter(([index, isChecked]) => isChecked)
            .map(([index]) => paymentSummary[index]);


        // Reset the selected settlements after submission
        setSelectedSettlements({});
    };

    return (
        <div className="payment-summary">
            {hasSettlements ? (
                <ul>
                    {paymentSummary.map((settlement, index) => (
                        <li key={index}>
                            {settlement.from === currentUser && (
                                <input
                                    type="checkbox"
                                    id={`settle-${index}`}
                                    checked={!!selectedSettlements[index]}
                                    onChange={(e) => handleCheckboxChange(index, e.target.checked)}
                                />
                            )}
                            <strong>{settlement.from}</strong> to pay <strong>{settlement.to}</strong>: <strong>${settlement.amount.toFixed(2)}</strong>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>All expenses are settled.</p>
            )}

            {hasSettlements && paymentSummary.some(settle => settle.from === currentUser) && (
                <button onClick={handleSubmit}>Submit Payments</button>
            )}
        </div>
    );
};

export default PaymentSummary;
