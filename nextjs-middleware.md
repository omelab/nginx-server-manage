Web applications often handle sensitive data and admin functionalities that should only be accessible to authenticated users. In such cases, route protection becomes crucial for safeguarding these routes from unauthorized access.


In this tutorial, we'll explore how to protect routes in Next.js 13 using three different methods. We'll learn how to protect routes on the client side and server side, and using middleware.


### Introduction
Route protection is an essential aspect of web application development. It is very much needed while handling the authentication process of your application.



It involves controlling access to specific routes based on the user's authentication status. For instance, you wouldn't want an unauthenticated user to access an admin dashboard or view sensitive user data.


Before we embark on this journey, here are some prerequisites to ensure you get the most out of this tutorial:


- Basic understanding of Next.js, Node.js, and JavaScript
- Familiarity with package managers like NPM or Yarn
- A code editor of your choice (like Visual Studio Code)
- Node.js and npm (or yarn) are installed on your machine.


Let's briefly discuss what Next.js is. According to its official documentation, Vercel created Next.js, a React framework primarily used for building full-stack web applications. Next.js offers various features, including file-based system routing, both client-side and server-side rendering, image optimizations, and enhanced support for TypeScript.

To start building web applications with Next.js, you can create a new Next.js project by using the following commands:




```bash
npx create-next-app@latest
```


After a successful installation, you will receive several prompts to configure your Next.js application. I recommend selecting the app router, as it's the recommended choice for routing in Next.js 13. For this tutorial, we will be using Tailwind CSS for styling and TypeScript.


### Routing in Next.js

In contrast to React applications, which often rely on third-party packages like react-router-dom for routing, Next.js 13 features its own built-in app router. This router supports shared layouts, nested routing, loading states, error handling, and more.

Next.js uses a file-based routing system. This means that folders containing page.js files define routes. A folder can also contain one or more subfolders.

Next.js simplifies the implementation of protected routes. Before diving into how to create protected routes in Next.js, let's understand how routes are created.






### How to Create a Route in Next.js

To demonstrate the different ways we can protect routes in Next.js 13, we will create routes: Home, Dashboard, Admin, Settings, and Profile page routes.


Let's perform some code cleanup. Remove all the code found on the ```"page.tsx"``` file of the app folder and insert the following code:


```tsx
// app/page.tsx
<main className="text-center h-screen flex justify-center items-center">
      <p>Home page</p>
 </main>
 ```



 The “page.tsx” file within the app folder will serve as the home page for this tutorial. Inside the app folder, create a "Profile" folder, and within it, create a “page.tsx” file. Add the following code:




 ```tsx
 // profile/page.tsx

<main className="text-center h-screen flex justify-center items-center">
      <div>
        <h1>Profile page</h1>        
      </div>
 </main>
 ```


Repeat this process for the "Dashboard," "Admin," and "Settings" folders. Each should contain a "page.tsx" file. If you have completed this, you have successfully set up your routes.

As mentioned earlier, we will be discussing different ways to protect your routes.



### Client-Side Route Protection

The client-side route protection is suitable for scenarios where you want to prevent unauthenticated users from accessing certain parts of your application on the client side.

You'd want to use this when you need a quick and straightforward way to protect routes without complex authentication processes. It's ideal for public websites or areas with minimal security requirements.


We won't be using any authentication processes to keep the tutorial simple. Instead, we will create a function that stores the authentication value.


To streamline the authentication, create an "Auth.ts" file inside the Utils folder, which should be located at the root of the Next.js app. The file should contain the following code:


```ts
export const isAuthenticated = false;
```


To secure your Profile route within a client component, we will be using useLayoutEffect. Let's see how it works by examining the code below:


```tsx
// profile/page.tsx

"use client";
import {isAuthenticated} from '@/Utils/Auth';
import { redirect } from 'next/navigation';
import { useLayoutEffect } from 'react';


const Profile = () => {

    useLayoutEffect(() => {
      const isAuth = isAuthenticated;
      if(!isAuth){
        redirect("/")
      }
    }, [])
   
  return (
    <main className="text-center h-screen flex justify-center items-center">
      <div>
        <h1>Profile</h1>        
      </div>
    </main>
  );
};


export default Profile;
```

In this code example, we have demonstrated a simple yet effective method for protecting routes within a client component.


By combining the ```useLayoutEffect``` hook with an authentication check and the redirect function, we have established a basic route protection mechanism. Unauthenticated users are redirected from the protected route to the "Home" route, enhancing the security of your application.


Inside the Profile component, we use the ```useLayoutEffect``` hook to check the user's authentication status when the component is mounted. We call the ```isAuthenticated```function and store its result in the ```isAuth``` variable.


If the user is authenticated, ```isAuth``` will be true – otherwise, it will be false. We check if the user is not authenticated (that is, if isAuth is false). If they are not, we use the ```redirect``` function to send them back to the homepage or another landing page. This effectively prevents unauthenticated users from accessing the protected route.


``` Alternatively, we can refactor the code above to protect the Profile route by using a Higher Order Component (HOC), which is a cleaner way to secure your route on the client side. ```


To use a HOC, we will create a file inside the "components" folder called isAuth and add the following code:


```tsx
// isAuth.tsx

"use client";
import { isAuthenticated } from "@/Utils/Auth";
import { useEffect } from "react";
import { redirect } from "next/navigation";


export default function isAuth(Component: any) {
  return function IsAuth(props: any) {
    const auth = isAuthenticated;


    useEffect(() => {
      if (!auth) {
        return redirect("/");
      }
    }, []);


    if (!auth) {
      return null;
    }

    return <Component {...props} />;
  };
}
```



The code above defines a Higher Order Component (isAuth) that checks the user's authentication status. If the user is not authenticated, it prevents the rendering of the protected component and redirects them to the homepage.

This Higher Order Component will be used to protect the "Dashboard" route in our application by wrapping the protected component with it, as shown below:


```tsx
// dashboard/page.tsx

import isAuth from "@/Components/isAuth";

const Dashboard = () => {
  return (
    <main className=" h-screen flex justify-center items-center">
      <p>Dashboard</p>
    </main>
  );
};


export default isAuth(Dashboard);
```



The code above integrates the ```isAuth``` HOC with the Dashboard component, ensuring that the dashboard is protected and can only be accessed by authenticated users. If a user is not authenticated, they will be redirected to a different route as defined by the ```isAuth``` HOC.


Hooray! We have successfully protected our routes on the client side using both ```useLayoutEffect``` and Higher Order Components.


#### Server-Side Route Protection

Server-side protection is the default for Next.js components. It's great for ensuring that server-rendered content is protected. You'd typically use it when you need to protect routes that should not be accessible to unauthenticated users, ensuring that sensitive information is not exposed.


Protecting your routes on the server side is straightforward. We can agree that all components in Next.js are server components by default. You can protect your routes on the server side as shown below:


```tsx
// admin/page.tsx

import {isAuthenticated} from '@/Utils/Auth';
import { redirect } from 'next/navigation';


const Admin = () => {
    const isAuth = isAuthenticated;


    if(!isAuth) {
        redirect("/");
    }
  return (
    <main className="text-center h-screen flex justify-center items-center">
      <div>
        <h1>Admin Page</h1>
      </div>
    </main>
  );
};


export default Admin;
```
The code above demonstrates route protection on server components, ensuring that only authenticated users can access the admin page. If an unauthenticated user attempts to access this route, they will be redirected to the homepage.


### Middleware-Based Route Protection

Middleware-based route protection in Next.js is a powerful approach to secure and control access to specific routes within a Next.js application. It involves the use of middleware functions to intercept incoming requests and enforce rules regarding route accessibility.

It is a powerful approach suitable for scenarios where you need fine-grained control over route access. It's often used for more complex applications, especially when dealing with sensitive data or user roles and permissions.

Middleware allows you to intercept requests and apply custom rules, making it perfect for enforcing strict security policies

This concept is crucial for ensuring that only authorized users can access protected routes, which often contain sensitive data or require specific privileges. Middleware-based route protection can be used on both the server and client components.



We are going to protect the “Settings” route using middleware. To do this, we will create a ```middleware.ts``` file. It is convention to create the middleware file in the root folder (the same level as the app or page folder) or inside the src folder, if applicable.


We will then protect our ```Settings``` route by adding the following code:



```ts
//middleware.ts

import { isAuthenticated } from "@/Utils/Auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


const protectedRoutes = ["/settings"];


export default function middleware(req: NextRequest) {
  if (!isAuthenticated && protectedRoutes.includes(req.nextUrl.pathname)) {
    const absoluteURL = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }
}
```

The code above provides a middleware-based approach to protecting the "Settings" page in a Next.js application. It checks if a user is not authenticated and whether the requested path matches one of the protected routes.


In the code above, ```isAuthenticated``` is imported from the ```@/Utils/Auth ``` module. This function is responsible for checking the authentication status of a user. If a user is authenticated, it returns true – otherwise, it returns false.


```NextResponse``` and ```NextRequest``` are part of Next.js's serverless functions API for handling HTTP requests and responses.


An array ```protectedRoutes``` is defined, containing the path(s) of the route(s) that need protection. In this case, it includes the ```/settings``` route. The middleware function is executed before handling a request and serves as the middleware responsible for route protection.


Within the middleware function, it checks if the user is not authenticated (```!isAuthenticated```) and if the requested path (```req.nextUrl.pathname```) matches one of the protected routes. If both conditions are met, it constructs an absolute URL that points to the root path ("/") of the application using a ```new URL ("/", req.nextUrl.origin)```. It then uses ```NextResponse.redirect``` to perform a redirect to the constructed absolute URL.


[Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
[Nested Middleware](https://nextjs.org/docs/messages/nested-middleware)
[Authentication](https://nextjs.org/docs/pages/building-your-application/authentication)

[Approach to Multiple Middleware and Auth Guard in Next.js App Routing](https://medium.com/@aididalam/approach-to-multiple-middleware-and-auth-guard-in-next-js-app-routing-bbb641401477)

[example code here](https://codesandbox.io/p/devbox/next-private-route-tutorial-456dmq?file=%2Fmiddleware.ts%3A9%2C2)

[help blog](https://medium.com/@zachshallbetter/middleware-in-next-js-a-comprehensive-guide-7dd0a928541a)
[How Next.js Middlewares Work](https://blog.stackademic.com/how-next-js-middlewares-work-103cae315163)
[tutorials](https://www.youtube.com/watch?v=ClY6vD4WHP0)


[iron-session](https://github.com/vvo/iron-session)
[supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
[kinde](https://kinde.com/docs/developer-tools/nextjs-sdk/)
[clerk](https://clerk.com/docs/quickstarts/nextjs)

