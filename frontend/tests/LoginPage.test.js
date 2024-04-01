import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';

const localStorageMock = (function() {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ token: 'fake_token' }),
      ok: true,
    })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
  window.localStorage.clear();
});

test('renders LoginPage component', () => {
    render(<LoginPage />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });
  

test('initial state is set correctly', () => {
  render(<LoginPage />);
  expect(screen.getByPlaceholderText('Username')).toHaveValue('');
  expect(screen.getByPlaceholderText('Password')).toHaveValue('');
  expect(screen.getByPlaceholderText('First Name')).toHaveValue('');
  expect(screen.getByPlaceholderText('Last Name')).toHaveValue('');
  expect(screen.getByPlaceholderText('Email')).toHaveValue('');
  expect(screen.getByPlaceholderText('Register Username')).toHaveValue('');
  expect(screen.getByPlaceholderText('Register Password')).toHaveValue('');
  expect(screen.getByPlaceholderText('Confirm Password')).toHaveValue('');
});

test('submits sign-in form with valid credentials', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginPage />);

    fireEvent.change(getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(getByText('Sign In'));

    await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('fake_token');
    });
});

test('sign-in with invalid credentials shows error message', async () => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
        ok: false,
        })
    );

    const { getByPlaceholderText, getByText } = render(<LoginPage />);

    fireEvent.change(getByPlaceholderText('Username'), { target: { value: 'wronguser' } });
    fireEvent.change(getByPlaceholderText('Password'), { target: { value: 'wrongpass' } });
    fireEvent.click(getByText('Sign In'));

    await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
});

test('toggles between sign in and sign up', () => {
    const { getByText } = render(<LoginPage />);
  
    const signUpButton = getByText('Sign Up');
    fireEvent.click(signUpButton);
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  
    const signInButton = getByText('Sign In');
    fireEvent.click(signInButton);
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
});

test('handles API error on sign in', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
  
    const { getByPlaceholderText, getByText } = render(<LoginPage />);
    
    fireEvent.change(getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(getByText('Sign In'));
  
    await waitFor(() => {
        expect(screen.getByText('There was an error logging in. Please try again.')).toBeInTheDocument();
    });
});

test('sign up form validation for empty fields', () => {
    const { getByText, getByPlaceholderText } = render(<LoginPage />);
  
    fireEvent.click(getByText('Sign Up'));
    fireEvent.change(getByPlaceholderText('Username'), { target: { value: '' } }); 
    fireEvent.change(getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(getByText('Create Account'));
  
    expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
});

test('successful sign up', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
  
    const { getByPlaceholderText, getByText } = render(<LoginPage />);
  
    fireEvent.click(getByText('Sign Up'));
    fireEvent.change(getByPlaceholderText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(getByPlaceholderText('Password'), { target: { value: 'newpassword123' } });
    fireEvent.change(getByPlaceholderText('Confirm Password'), { target: { value: 'newpassword123' } });
    fireEvent.click(getByText('Create Account'));
  
    await waitFor(() => {
        expect(screen.getByText('Welcome newuser!')).toBeInTheDocument();
    });
});


test('displays error message on sign up failure', async () => {
    global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ message: 'Sign up failed' }),
        ok: false,
    })
    );

    const { getByText, getByPlaceholderText } = render(<LoginPage />);
  
    fireEvent.click(getByText('Sign Up'));
    fireEvent.change(getByPlaceholderText('First Name'), { target: { value: 'John' } });
    fireEvent.change(getByPlaceholderText('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(getByPlaceholderText('Email'), { target: { value: 'johndoe@example.com' } });
    fireEvent.change(getByPlaceholderText('Username'), { target: { value: 'johndoe' } });
    fireEvent.change(getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(getByText('Create Account'));

    await waitFor(() => {
    expect(screen.getByText('Sign up failed')).toBeInTheDocument();
    });
});

import { useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
...jest.requireActual('react-router-dom'),
useNavigate: jest.fn(),
}));

test('navigates to personal page on successful sign in', async () => {
global.fetch = jest.fn(() =>
    Promise.resolve({
    json: () => Promise.resolve({ token: 'fake_token' }),
    ok: true,
    })
);

const navigate = useNavigate();
const { getByPlaceholderText, getByText } = render(<LoginPage />);

fireEvent.change(getByPlaceholderText('Username'), { target: { value: 'testuser' } });
fireEvent.change(getByPlaceholderText('Password'), { target: { value: 'password123' } });
fireEvent.click(getByText('Sign In'));

await waitFor(() => {
    expect(navigate).toHaveBeenCalledWith('/personal');
});
});

  