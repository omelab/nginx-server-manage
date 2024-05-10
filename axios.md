```ts
//@/config/api
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Retrieve access token from local storage or cookies
    const accessToken = localStorage.getItem('accessToken') || getCookie('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to get cookie by name
function getCookie(name) {
  const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return cookieValue ? cookieValue.pop() : '';
}

export default api;

```


```ts
//fetchApiData

import api from '@/config/api'; // Import your Axios instance
import { refreshToken } from './refreshToken'; // Import your token refresh function
import { removeForwardSlashes } from '../utils/helper';

// Function to fetch data from the API with automatic token refresh
const fetchApiData = async (
  reqUrl: string,
  method = 'get',
  data: any = null
) => {
  try {
    const cleanUrl = removeForwardSlashes(reqUrl);
    const url: string = `${cleanUrl}`;

    // Make the HTTP request using Axios instance
    const response = await api({
      method,
      url,
      data,
    });

    // If response is successful, return the data
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    // If response is unauthorized (status code 401), attempt token refresh
    if (response.status === 401) {
      // Attempt token refresh using your refresh token and update the authorization header
      const newAuthToken = await refreshToken();
      
      // Retry the original request with the new token
      const retryResponse = await api({
        method,
        url,
        data,
      });

      // Return data from the retried request
      return retryResponse.data;
    }

    // If response is any other error, throw an error
    throw new Error('Failed to fetch data');
  } catch (error) {
    // Handle error messages appropriately
    console.error('Error:', error);
    throw new Error('Failed to fetch data');
  }
};

export default fetchApiData;

```



## Different way to generate instance

```ts
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

// Create a new Axios instance with custom configuration
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or wherever you store it
    const token = getToken();

    // If token exists, set Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Handle successful responses
    return response;
  },
  async (error) => {
    // Handle error responses
    if (error.response && error.response.status === 401) {
      // Token expired or unauthorized, attempt token refresh
      await refreshToken(); // Implement your refresh token logic
      // Retry the original request with the new token
      return api(error.config);
    }
    // For other errors, reject the promise
    return Promise.reject(error);
  }
);

// Function to refresh the access token
export const refreshToken = async () => {
  try {
    const refreshToken = getRefreshToken(); // Implement this function to retrieve the refresh token

    // Make a request to the endpoint for refreshing tokens
    const response = await api.post('/auth/refresh', {
      refreshToken,
    });

    // If successful, update the access token
    const accessToken = response.data.accessToken; // Assuming response contains the new access token
    setAccessToken(accessToken); // Implement this function to set the new access token

    return accessToken;
  } catch (error) {
    // Handle refresh token failure
    console.error('Failed to refresh token:', error);
    throw new Error('Failed to refresh token');
  }
};

export default api;
```



```ts
// Import the necessary dependencies
import Cookies from 'js-cookie';

// Function to retrieve the refresh token from cookies
export const getRefreshToken = async () => {
  if (typeof window === 'undefined') {
    // Server-side execution
    const { cookies } = await import('next/headers');
    const token = cookies().get('refreshToken')?.value;
    if (token) {
      return token;
    }
  }
  // Client-side execution 
  return Cookies.get('refreshToken'); 
};

export default getRefreshToken;

```



```ts
import { setCookie } from 'nookies'; // Using nookies library for server-side cookies

export async function getServerSideProps(context) {
  // Set the cookie in the response headers
  setCookie(context, 'refreshToken', 'your_token_value', {
    path: '/', // Path where the cookie is accessible
    maxAge: 30 * 24 * 60 * 60, // Cookie expiry (in seconds)
    httpOnly: true, // Cookie is accessible only via HTTP(S) headers
    secure: process.env.NODE_ENV === 'production', // Cookie is only sent over HTTPS in production
  });

  // Return any props needed by your page
  return {
    props: {
      // Your props here
    },
  };
}
```

```ts
import Cookies from 'js-cookie';

// Set the cookie on the client-side
Cookies.set('refreshToken', 'your_token_value', {
  expires: 30, // Cookie expiry (in days)
  path: '/', // Path where the cookie is accessible
  secure: process.env.NODE_ENV === 'production', // Cookie is only sent over HTTPS in production
  sameSite: 'strict', // Restrict cookie to same-site requests
});
```

- https://github.com/vercel/next.js/discussions/49950
- https://javascript.plainenglish.io/3-tips-to-make-your-next-js-app-more-stable-8a8f61f30ec5
- https://javascript.plainenglish.io/effortless-next-js-data-fetching-with-swr-and-axios-a197517af7c1
- https://medium.com/@mak-dev/zustand-with-next-js-14-server-components-da9c191b73df




