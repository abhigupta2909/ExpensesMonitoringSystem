import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import PersonIcon from '@mui/icons-material/Person';
import Groups2Icon from '@mui/icons-material/Groups2';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Paper from '@mui/material/Paper';
import '../styles/BottomNav.css';

const BottomNav = () => {
    const [value, setValue] = React.useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        
        if (location.pathname === '/personal') setValue(0);
        else if (location.pathname === '/groups') setValue(1);
        else if (location.pathname === '/dashboard') setValue(2);
    }, [location.pathname]);

    const handleChange = (event, newValue) => {
        setValue(newValue);

        if (newValue === 0) navigate('/personal');
        else if (newValue === 1) navigate('/groups');
        else if (newValue === 2) navigate('/dashboard');
    
    };

    return (
        <Paper className="bottom-nav" elevation={3}>
            <BottomNavigation
                showLabels
                value={value}
                onChange={handleChange}
                className="bottom-nav"
            >
                <BottomNavigationAction label="Personal Expense" icon={<PersonIcon />} className="bottom-nav-action-root" />
                <BottomNavigationAction label="Group" icon={<Groups2Icon />} className="bottom-nav-action-root" />
                <BottomNavigationAction label="Dashboard" icon={<DashboardIcon />} className="bottom-nav-action-root" />
            </BottomNavigation>
        </Paper>
    );
};

export default BottomNav;
