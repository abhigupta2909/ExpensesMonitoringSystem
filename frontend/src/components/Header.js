import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import ProfileDropdown from './ProfileDropdown';

function Header({ productName }) {
    const [displayName, setDisplayName] = useState('Guest');
    const [displayUsername, setDisplayUserName] = useState('Guest');
    const [displayEmail, setDisplayEmail] = useState('Guest');

    const navigate = useNavigate();


    // Logout functionality
    const handleLogout = () => {
        // Clear token and other user info from storage
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        // Redirect on logout
        navigate('/');
    };

    // Fetch user profile
    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            fetch('http://127.0.0.1:5000/api/users/profile', {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(JSON.stringify(data));
                if (data.success) {
                    // Set the display name to the user's first and last name
                    setDisplayName(`${data.first_name} ${data.last_name}`);
                    setDisplayUserName(`${data.username}`);
                    setDisplayEmail(`${data.email}`);
                }
            })
            .catch(error => {
                console.error('Error fetching user details:', error);
            });
        }
    }, []);

    return (
        <div className="header">
            <div className="header-left">
                <h2>{productName}</h2>
            </div>
            <div className="header-right">
                <span className="username">{displayName}</span>
                <ProfileDropdown displayName={displayName} onLogout={handleLogout} email={displayEmail} username={displayUsername} />
            </div>
        </div>
    );
}

export default Header;
