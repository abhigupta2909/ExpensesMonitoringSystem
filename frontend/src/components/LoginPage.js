import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';
import Footer from './Footer';

function LoginPage() {
    const [isSignUpActive, setIsSignUpActive] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const toggleSignUp = () => setIsSignUpActive(true);
    const toggleSignIn = () => setIsSignUpActive(false);
    const [registerData, setRegisterData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        registerUsername: '',
        registerPassword: '',
        confirmPassword: '',
    });
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();

        // Data to be sent to the API
        const data = {
            username: username,
            password: password,
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (response.ok) {
                // API returns a token on successful login
                localStorage.setItem('token', result.token);
                // Navigate the users personal exp tab
                navigate('/personal');
            } else {
                // Handle errors returned from the API
                setErrorMessage(result.message);
            }
        } catch (error) {
            setErrorMessage('There was an error logging in. Please try again.');
        }
    };

    async function login(username, password,  navigate, setErrorMessage) {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
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

    const handleSignUp = async (e) => {
        e.preventDefault();
        console.log("###### ", registerData)
        if (registerData.firstName === '' ||registerData.lastName === '' || registerData.email === '') {
            alert("Enter user data to register.");
            return; 
        }
        if (registerData.registerPassword.length < 8) {
            alert("Password must be at least 8 characters long.");
            return;
        }

        if (registerData.registerPassword !== registerData.confirmPassword) {
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
                    "username": registerData.registerUsername,
                    "password": registerData.registerPassword,
                    "first_name": registerData.firstName,
                    "last_name": registerData.lastName,
                    "email": registerData.email,
                }),
            });

            const data = await response.json();
            console.log('###### ', data);
            if (response.ok) {
                localStorage.removeItem('token');
                alert('Registered successfully!');
                console.log("Registered data: ", registerData);
                await login(registerData.registerUsername, registerData.registerPassword,  navigate, setErrorMessage);
            } else {
                alert(data.message || 'Registration failed!');
            }
        } catch (error) {
            alert('There was an error during registration. Please try again later.');
        }
    };
    
    const handleChange = (e) => {
        setRegisterData({
            ...registerData,
            [e.target.name]: e.target.value,
        });
    };
    return (
        <div className='login-page'>
            <div className={`containerLogin ${isSignUpActive ? 'active' : ''}`}>
                <div className="form-container sign-up">
                    <form onSubmit={handleSignUp}>
                        <h1>Create Account</h1>
                        <input type="text" name="firstName" placeholder="First Name" value={registerData.firstName} onChange={handleChange} />
                        <input type="text" name="lastName" placeholder="Last Name" value={registerData.lastName} onChange={handleChange} />
                        <input type="email" name="email" placeholder="Email" value={registerData.email} onChange={handleChange} />
                        <input type="text" name="registerUsername" placeholder="Username" value={registerData.registerUsername} onChange={handleChange} />
                        <input type="password" name="registerPassword" placeholder="Password" value={registerData.registerPassword} onChange={handleChange} />
                        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={registerData.confirmPassword} onChange={handleChange} />
                        <button type="submit">Sign Up</button>
                    </form>
                </div>

                <div className="form-container sign-in">
                    <form onSubmit={handleSignIn}>
                        <h1>Sign In</h1>
                        <div className="social-icons">
                        </div>
                        <input 
                            type="text" 
                            placeholder="Username" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                        <a href="#"></a>
                        {errorMessage && <div className="error-message">{errorMessage}</div>}
                        <button>Sign In</button>
                    </form>
                </div>

                <div className="toggle-container">
                    <div className="toggle">
                        <div className="toggle-panel toggle-left" onClick={toggleSignIn}>
                            <h1>Welcome Back!</h1>
                            <p>To keep connected with us please login with your personal info</p>
                            <button id="signIn">Sign In</button>
                        </div>
                        <div 
                            className="toggle-panel toggle-right" 
                            onClick={toggleSignUp}
                        >
                            <h1>Hello!</h1>
                            <p>Enter your personal details and start your finance journey with us.</p>
                            <button id="signUp">Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    );
}

export default LoginPage;
