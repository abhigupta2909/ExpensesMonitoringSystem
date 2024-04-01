import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import PersonalExpenseManager from './components/PersonalExpenseManager';
import LoginPage from './components/LoginPage';
import GroupExpenseManager from './components/GroupExpenseManager';
import BottomNav from './components/BottomNav'; // Import your BottomNav component
import Dashboard from './components/Dashboard'
function App() {
  return (
    <Router>
      <Box sx={{ pb: 7 }}>
        <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/personal" element={<PersonalExpenseManager />} />
                <Route path="/groups" element={<GroupExpenseManager />} />
                <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Box>
      <RenderBottomNav />
    </Router>
  );
}

// Component to conditionally render BottomNav
function RenderBottomNav() {
  const location = useLocation();

  // Don't render BottomNav on the login page
  if (location.pathname === '/') {
    return null;
  }

  return <BottomNav />;
}

export default App;
