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


## Unique Field Falidation
you can create a generic validation function that you can reuse for different fields. Here's an example of a more generic approach:

1. Generic Validator (generic.validator.ts):

```ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator } from 'class-validator';
import { PrismaService } from './prisma.service';

interface UniqueFieldOptions {
  entity: string;
  field: string;
}

@ValidatorConstraint({ name: 'uniqueField', async: true })
export class UniqueFieldConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: any, args: ValidationArguments) {
    const { entity, field } = args.constraints[0] as UniqueFieldOptions;
    const entityId = args.object['id'];

    const condition: Record<string, any> = { [field]: value };

    if (entityId) {
      condition['id'] = { not: entityId };
    }

    const existingEntity = await this.prisma[entity].findUnique({
      where: condition,
    });

    return !existingEntity;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} $value is already in use.`;
  }
}

export function IsUniqueField(options: UniqueFieldOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} must be unique`,
        ...options,
      },
      constraints: [options],
      validator: UniqueFieldConstraint,
    });
  };
}
```

2. Usage in DTO (create-user.dto.ts):

```ts
import { IsEmail, IsNotEmpty, IsString, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { PrismaService } from './prisma.service';
import { IsUniqueField } from './generic.validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @IsUniqueField({ entity: 'user', field: 'email' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsUniqueField({ entity: 'user', field: 'name' })
  name: string;
}
```

3. Usage in DTO (update-user.dto.ts):

```ts
import { IsEmail, IsNotEmpty, IsString, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { PrismaService } from './prisma.service';
import { IsUniqueField } from './generic.validator';

export class UpdateUserDto {
  id: string;

  @IsEmail()
  @IsNotEmpty()
  @IsUniqueField({ entity: 'user', field: 'email' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsUniqueField({ entity: 'user', field: 'name' })
  name: string;
}
```

4. User Service (user.service.ts):

```ts
// user.service.ts
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const errors = await validate(createUserDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
      },
    });

    return newUser;
  }

  async updateUser(updateUserDto: UpdateUserDto) {
    const errors = await validate(updateUserDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: updateUserDto.id,
      },
    });

    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: updateUserDto.id,
      },
      data: {
        email: updateUserDto.email,
      },
    });

    return updatedUser;
  }
}
```

5. User Controller (user.controller.ts):

```ts
// user.controller.ts
import { Controller, Post, Body, Put, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Put(':id')
  updateUser(@Param('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
    updateUserDto.id = userId;
    return this.userService.updateUser(updateUserDto);
  }
}
```




## How can you get Category wise Post

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Category, Prisma } from '@prisma/client';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async getNewsByParentCategoryId(parentCategoryId: number): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        OR: [
          { id: parentCategoryId }, // Include parent category
          { parentId: parentCategoryId }, // Include subcategories
        ],
      },
      include: {
        news: true, // Include news related to each category
      },
    });
  }
}
```


or you can 
```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { News, Prisma } from '@prisma/client';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async getNewsByParentCategoryId(parentCategoryId: number): Promise<News[]> {
    return this.prisma.news.findMany({
      where: {
        category: {
          OR: [
            { id: parentCategoryId }, // Include news from parent category
            { parentId: parentCategoryId }, // Include news from subcategories
          ],
        },
      },
    });
  }
}
```

#### If you want to get news with recursive category wise you can do that like:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Category, News, Prisma, Status } from '@prisma/client';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async getNewsByParentCategoryId(parentCategoryId: number): Promise<News[]> {
    // Fetch the parent category and its children recursively
    const categories = await this.getCategoriesRecursively(parentCategoryId);

    // Extract category IDs from the fetched categories
    const categoryIds = categories.map(category => category.id);

    // Fetch news associated with the extracted category IDs
    return this.prisma.news.findMany({
      where: {
        categoryId: {
          in: categoryIds,
        },
      },
    });
  }

  // Recursively fetch categories and their children
  private async getCategoriesRecursively(categoryId: number): Promise<Category[]> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { children: true }, // Include child categories
    });

    if (!category) {
      return [];
    }

    // Include the current category and recursively fetch children
    const children = await Promise.all(category.children.map(child => this.getCategoriesRecursively(child.id)));
    
    // Flatten the array of arrays into a single array
    return [category, ...children.flat()];
  }
}
```



## complex query
```ts
@Get('news')
  async allNews(
    @Req() req: Request,
    @Query() query: FilterNewsDto,
  ): Promise<any> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const where: any = { deletedAt: null };
    const orConditions: any[] = [];
    let orderBy: any = { id: 'desc' };

    if (query.keyword && query.keyword !== '') {
      orConditions.push({
        title: { contains: query.keyword, mode: 'insensitive' },
      });
      orConditions.push({
        shortTitle: { contains: query.keyword, mode: 'insensitive' },
      });
      orConditions.push({
        subTitle: { contains: query.keyword, mode: 'insensitive' },
      });
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    if (query.status && query.status.length > 0) {
      where.status = { in: query.status };
    }

    if (query.newsFormat && query.newsFormat.length > 0) {
      where.newsFormat = query.newsFormat;
    }

    if (query.id && query.id > 0) {
      where.id = query.id;
    }

    if (query.uid && query.uid != '') {
      where.uid = query.uid;
    }

    if (query.primCatId && query.primCatId > 0) {
      where.primCatId = query.primCatId;
    }

    if (query.categoryId && query.categoryId > 0) {
      where.categories = {
        some: {
          id: query.categoryId,
        },
      };
    }

    if (query.categoryIds && query.categoryIds.length > 0) {
      where.categories = {
        some: {
          id: { in: query.categoryIds },
        },
      };
    }

    if (query.categorySlug && query.categorySlug != '') {
      where.categories = {
        some: {
          slug: query.categorySlug,
        },
      };
    }

    if (query.categorySlug && query.categorySlug != '') {
      where.OR = [
        {
          categories: {
            some: {
              slug: query.categorySlug,
            },
          },
        },
        {
          primCategory: {
            slug: { contains: query.categorySlug, mode: 'insensitive' },
          },
        },
      ];
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = {
        some: {
          slug: { in: query.tags },
        },
      };
    }

    if (query.divisionId && query.divisionId > 0) {
      where.divisionId = query.divisionId;
    }

    if (query.divisionName && query.divisionName !== '') {
      where.division = {
        OR: [
          { bn_name: { contains: query.divisionName, mode: 'insensitive' } },
          { name: { contains: query.divisionName, mode: 'insensitive' } },
          { slug: { contains: query.divisionName, mode: 'insensitive' } },
        ],
      };
    }

    if (query.districtId && query.districtId > 0) {
      where.districtId = query.districtId;
    }

    if (query.districtName && query.districtName !== '') {
      where.district = {
        OR: [
          { bn_name: { contains: query.districtName, mode: 'insensitive' } },
          { name: { contains: query.districtName, mode: 'insensitive' } },
          { slug: { contains: query.districtName, mode: 'insensitive' } },
        ],
      };
    }

    if (query.upazilaId && query.upazilaId > 0) {
      where.upazilaId = query.upazilaId;
    }

    if (query.upazilaName && query.upazilaName !== '') {
      where.upazila = {
        OR: [
          { bn_name: { contains: query.upazilaName, mode: 'insensitive' } },
          { name: { contains: query.upazilaName, mode: 'insensitive' } },
          { slug: { contains: query.upazilaName, mode: 'insensitive' } },
        ],
      };
    }

    if (query.homepageFeatured && query.homepageFeatured.toString() == 'true') {
      where.homepageFeatured = true;
    }

    if (query.tickerHot && query.tickerHot.toString() == 'true') {
      where.tickerHot = true;
    }

    if (query.pageFeatured && query.pageFeatured.toString() == 'true') {
      where.pageFeatured = true;
    }

    if (query.publishedAt) {
      where.publishedAt = {
        gte: new Date(query.publishedAt),
      };
    }

    if (query.startDate) {
      where.publishedAt = {
        gte: new Date(query.startDate),
      };
    }

    if (query.endDate) {
      where.publishedAt = {
        lte: new Date(query.endDate),
      };
    }

    if (query.viewCount && query.viewCount > 0) {
      where.viewCount = {
        gte: query.viewCount, // greater than viewCount
      };
    }

    if (
      query.excludeNewsIds &&
      Array.isArray(query.excludeNewsIds) &&
      query.excludeNewsIds.length > 0
    ) {
      where.id = { notIn: query.excludeNewsIds };
    }

    if (
      query.orderKey &&
      query.orderKey != '' &&
      query.orderType &&
      query.orderType != ''
    ) {
      orderBy = { [query.orderKey]: query.orderType };
      if (query.orderKey == 'comments') {
        orderBy = {
          comments: {
            _count: query.orderType,
          },
        };
      }
    }

    return await this.newsService.findAll(page, limit, where, orderBy);
  }
  ```

