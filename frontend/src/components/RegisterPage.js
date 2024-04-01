import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

async function loginUser(credentials, navigate, setErrorMessage) {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        const result = await response.json();
        if (response.ok) {
            localStorage.setItem('token', result.token);
            navigate('/personal');
        } else {
            setErrorMessage(result.message);
        }
    } catch (error) {
        setErrorMessage('There was an error logging in. Please try again.');
    }
}


function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Add a check to ensure passwords match
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
    
        try {
            const response = await fetch('http://127.0.0.1:5000/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "username": formData.username,
                    "password": formData.password,
                    "first_name": formData.firstName,
                    "last_name": formData.lastName,
                    "email": formData.email,
                }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                localStorage.removeItem('token');
                // Handle successful registration
                alert('Registered successfully!');
                await loginUser({ username: formData.username, password: formData.password }, navigate, setErrorMessage);
            } else {
                // Handle errors from the server.
                alert(data.message || 'Registration failed!');
            }
        } catch (error) {
            // Handle network errors or other issues with the API call
            alert('There was an error during registration. Please try again later.');
        }
    };
    

    return (
        <div className="register-container">
            <h2>Register</h2>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
}

export default RegisterPage;
