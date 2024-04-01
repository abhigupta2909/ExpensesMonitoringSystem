import React from 'react';
import { render } from '@testing-library/react';
import GroupManagement from './GroupManagement';

test('renders GroupManagement component elements', () => {
    const { getByText, getByPlaceholderText } = render(<GroupManagement />);
    expect(getByPlaceholderText('Group Name')).toBeInTheDocument();
    expect(getByText('Create Group')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter API key')).toBeInTheDocument();
    expect(getByText('Join Group')).toBeInTheDocument();
  });
  


test('adds a new group', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ message: "Group created successfully" }),
      ok: true,
    })
  );

  const { getByPlaceholderText, getByText } = render(<GroupManagement />);
  fireEvent.change(getByPlaceholderText('Group Name'), { target: { value: 'New Group' } });
  fireEvent.click(getByText('Create Group'));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(getByText('Group created successfully')).toBeInTheDocument();
    expect(getByPlaceholderText('Group Name').value).toBe('');
  });
});


test('joins a group with API key', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ message: "Joined group successfully" }),
        ok: true,
      })
    );
  
    const { getByPlaceholderText, getByText } = render(<GroupManagement />);
    fireEvent.change(getByPlaceholderText('Enter API key'), { target: { value: '123456' } });
    fireEvent.click(getByText('Join Group'));
  
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(getByText('Joined group successfully')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter API key').value).toBe('');
      });
  });


  test('sends an invite to a new member', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ message: "Invitation sent successfully" }),
        ok: true,
      })
    );
  
    const { getByPlaceholderText, getByText } = render(<GroupManagement />);
    fireEvent.change(getByPlaceholderText('Invite via Email'), { target: { value: 'test@example.com' } });
    fireEvent.click(getByText('Send Invite'));
  
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(getByText('Invitation sent successfully')).toBeInTheDocument();
        expect(getByPlaceholderText('Invite via Email').value).toBe('');
      });
  });

  test('delete a group', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
      })
    );
  
    const { getByText } = render(<GroupManagement />);
    fireEvent.click(getByText('Delete Group'));
    fireEvent.click(getByText('Confirm'));
  
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(getByText('Group deleted successfully')).toBeInTheDocument();
      });
  });