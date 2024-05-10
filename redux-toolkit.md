## How can we use Redux Toolkit

```js
// authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;

```

```js
// authService.js
export const login = async (credentials) => {
  // Call your API endpoint for login
  // Example: const response = await fetch('/login', { method: 'POST', body: JSON.stringify(credentials) });
  // const data = await response.json();
  // return data;
};

export const register = async (userData) => {
  // Call your API endpoint for registration
};

export const logout = async () => {
  // Call your API endpoint for logout
};

```


```jsx
// LoginComponent.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from './authSlice';
import { login as loginService } from './authService';

const LoginComponent = () => {
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await loginService({ username, password });
      dispatch(login(user));
      // Redirect user after successful login
    } catch (error) {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
};

export default LoginComponent;
```


```jsx
// RegistrationComponent.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from './authSlice';
import { register as registerService } from './authService';

const RegistrationComponent = () => {
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const user = await registerService({ username, password });
      dispatch(login(user));
      // Redirect user after successful registration
    } catch (error) {
      setError('Registration failed');
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Register</button>
      {error && <p>{error}</p>}
    </form>
  );
};

export default RegistrationComponent;
```


```jsx
// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginComponent from './LoginComponent';
import RegistrationComponent from './RegistrationComponent';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={LoginComponent} />
        <Route path="/register" component={RegistrationComponent} />
        {/* Other routes */}
      </Switch>
    </Router>
  );
};

export default App;
```


## Using Typescript

```ts
// types.ts
export interface UserCredentials {
  username: string;
  password: string;
}

export interface UserData {
  username: string;
  // Other user data properties
}
```


```ts
// authService.js
export const login = async (credentials) => {
  // Call your API endpoint for login
  // Example: const response = await fetch('/login', { method: 'POST', body: JSON.stringify(credentials) });
  // const data = await response.json();
  // return data;
};

export const register = async (userData) => {
  // Call your API endpoint for registration
};

export const logout = async () => {
  // Call your API endpoint for logout
};
```


```ts
// useAuth.ts
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login as loginAction, logout as logoutAction } from './authSlice';
import { login as loginService, logout as logoutService, register as registerService } from './authService';
import { UserCredentials, UserData } from './types';

interface AuthError {
  message: string;
}

export const useAuth = () => {
  const dispatch = useDispatch();
  const [error, setError] = useState<AuthError | null>(null);

  const login = async (credentials: UserCredentials) => {
    try {
      const user: UserData = await loginService(credentials);
      dispatch(loginAction(user));
      // Redirect user after successful login
    } catch (error) {
      setError({ message: 'Invalid credentials' });
    }
  };

  const register = async (userData: UserCredentials) => {
    try {
      const user: UserData = await registerService(userData);
      dispatch(loginAction(user));
      // Redirect user after successful registration
    } catch (error) {
      setError({ message: 'Registration failed' });
    }
  };

  const logout = async () => {
    try {
      await logoutService();
      dispatch(logoutAction());
      // Redirect user after successful logout
    } catch (error) {
      setError({ message: 'Logout failed' });
    }
  };

  return { login, register, logout, error };
};
```

```tsx
// LoginComponent.tsx
import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { UserCredentials } from './types';

const LoginComponent: React.FC = () => {
  const { login, error } = useAuth();
  const [credentials, setCredentials] = useState<UserCredentials>({ username: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(credentials);
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="text" placeholder="Username" value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} />
      <input type="password" placeholder="Password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} />
      <button type="submit">Login</button>
      {error && <p>{error.message}</p>}
    </form>
  );
};

export default LoginComponent;
```


```tsx
// RegistrationComponent.tsx
import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { UserCredentials } from './types';

const RegistrationComponent: React.FC = () => {
  const { register, error } = useAuth();
  const [userData, setUserData] = useState<UserCredentials>({ username: '', password: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(userData);
  };

  return (
    <form onSubmit={handleRegister}>
      <input type="text" placeholder="Username" value={userData.username} onChange={(e) => setUserData({ ...userData, username: e.target.value })} />
      <input type="password" placeholder="Password" value={userData.password} onChange={(e) => setUserData({ ...userData, password: e.target.value })} />
      <button type="submit">Register</button>
      {error && <p>{error.message}</p>}
    </form>
  );
};

export default RegistrationComponent;
```
