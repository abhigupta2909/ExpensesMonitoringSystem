import React, { useState, useEffect, useRef } from 'react';
import userIcon from '../asset/profile_icon.jpg';
import '../styles/ProfileDropdown.css'; 
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
function ProfileDropdown({ displayName, onLogout, email, username }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef();

    useEffect(() => {
        const handler = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);

        return () => {
            document.removeEventListener("mousedown", handler);
        };
    }, []);

    const DropdownItem = ({ text, onClick, icon }) => (
        <li className='dropdownItem' onClick={onClick}>
            {icon && <span className='dropdownIcon'>{icon}</span>}
            <a>{text}</a>
        </li>
    );

    return (
        <div className='menu-container' ref={menuRef}>
            <div className='menu-trigger' onClick={() => setOpen(!open)}>
                <img src={userIcon} alt="User" />
            </div>

            <div className={`dropdown-menu ${open ? 'active' : 'inactive'}`}>
                <h3>{displayName}</h3>
                <ul>
                    <li className='dropdownItem'>
                        <span>{username}</span>
                    </li>
                    <li className='dropdownItem'>
                        <span>{email}</span>
                    </li>
                    <DropdownItem
                        text="Logout"
                        onClick={onLogout}
                        icon={<PowerSettingsNewIcon />} // Include the icon as a prop
                    />
                </ul>
            </div>
        </div>
    );
}

export default ProfileDropdown;
