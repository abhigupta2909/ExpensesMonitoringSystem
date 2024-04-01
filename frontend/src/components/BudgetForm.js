import React, { useState } from 'react';

function BudgetForm({ setBudget }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setBudget(parseFloat(value));
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Set Monthly Budget:
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <button type="submit">Set</button>
    </form>
  );
}

export default BudgetForm;
