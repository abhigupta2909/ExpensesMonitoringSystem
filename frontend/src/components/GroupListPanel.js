import React from 'react';
import '../styles/GroupListPanel.css';

function GroupListPanel({ groups, selectedGroup, onGroupSelect }) {
    return (
        <div className="group-list-panel">
            <h2 className="group-list-header">Your Groups</h2>
            {groups.map(group => (
                <div 
                    key={group.group_id}
                    className={`group-item ${selectedGroup === group.group_id ? 'active' : ''}`}
                    onClick={() => onGroupSelect(group.group_id)}
                >
                    {group.group_name}
                </div>
            ))}
        </div>
    );
}

export default GroupListPanel;
