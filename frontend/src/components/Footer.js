import React from 'react';
import '../styles/Footer.css';

function Footer() {
    return (
        <footer className="app-footer">
            <p>ExpenseMonitoringSystem.com</p>
            <p>Copyright © {new Date().getFullYear()} ExpenseMonitoringSystem™.<br/>
            All rights reserved.<br/>
            Boston, MA, 02135</p>
        </footer>
    );
}

export default Footer;
