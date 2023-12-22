## Create Resource Step by step

you can create full resources with single [command](https://docs.nestjs.com/recipes/crud-generator) like:
```bash
nest g resource users
```


if you want to create resources with multiple steps you need to flow 4 steps like:

1. Create Modules (specifically used for module specifying)
2. Create Controllers (specificaly used for routes defined)
3. Create Service (specificaly used for functional tasks)
4. Create Dto for validation (used for validation functionalities)
5. Create Entity (defining table fields)

you can crate all of steps using [commands](https://docs.nestjs.com/cli/usages) also you can [flow this instructions](https://www.digitalocean.com/community/tutorials/getting-started-with-nestjs)

Step 1: Generating a Module
```bash
nest generate module books

nest generate controller books

nest generate service books

nest generate entity books
```
 
## pm2 start project with namespace
```bash 
 pm2 start yarn --interpreter bash --name api -- start

 pm2 start "yarn dev" --name api
```



## Create Rouls Guard

```bash
nest generate guard roles
```
This will create a file named roles.guard.ts in the src/guards directory. Open this file and modify it to suit your needs:

```ts
// src/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndMerge<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      // No specific roles required, allow access
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      // No user found, deny access
      return false;
    }

    // Check if the user has any of the required roles
    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
```
Next, let's create a custom decorator to mark the roles required for a specific route. Create a file named roles.decorator.ts in the src/decorators directory:


```ts
// src/decorators/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

Now, you can use the @Roles() decorator to specify the required roles for a route. For example:


```ts
// your.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('example')
export class YourController {
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getAdminData() {
    return 'This data is only accessible to users with the "admin" role';
  }

  @Get('user')
  @UseGuards(RolesGuard)
  @Roles('user')
  getUserData() {
    return 'This data is only accessible to users with the "user" role';
  }
}
```

if your provided header user not include role or permission you can get user role using sercice (prisma) like:

```ts
// src/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector,  private readonly prisma: PrismaService) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndMerge<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      // No specific roles required, allow access
      return true;
    }

    const { loginUser } = context.switchToHttp().getRequest();

    if (!loginUser) {
      // No user found, deny access
      return false;
    }

    try {  

	 	const user = await this.prisma.user.findUnique({
	        where: { id: loginUser.sub },
	        include: { roles:  true },
	      });

 		if (!user || !user.roles) {
        	return false; // User not found
      	}

		// Check if the user has any of the required roles
    	return requiredRoles.some((role) => user.roles.includes(role));
 
    } catch (error) {
      console.error('Error during Prisma query:', error);
      return false;
    }
    
  }
}
```


