## Create a Middleware for Domain Filtering
```bash
npm install @nestjs/common @nestjs/platform-express
```


```ts
// src/middleware/domain-filter.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DomainFilterMiddleware implements NestMiddleware {
  // Define an array of allowed domains
  private allowedDomains = ['https://example.com', 'https://api.example.com'];

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.header('Origin');

    if (this.allowedDomains.includes(origin)) {
      // Allow the request to continue
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    } else {
      // Deny the request
      res.status(403).send('Forbidden');
    }
  }
}
```
## Register the Middleware:
```ts
// src/app.module.ts

import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { DomainFilterMiddleware } from './middleware/domain-filter.middleware';

@Module({
  // Your module configuration
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DomainFilterMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
```



## use Multiple middleware
```ts
// src/app.module.ts

import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { DomainFilterMiddleware } from './middleware/domain-filter.middleware';
import { ProtectedMiddleware } from './middleware/protected.middleware';

@Module({
  // Your module configuration
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DomainFilterMiddleware, ProtectedMiddleware) // Chain multiple middlewares
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }

   consumer
      .apply(ProtectedMiddleware)
      .forRoutes({ path: 'specific-url', method: RequestMethod.ALL });
}
```


## DomainFilterMiddleware get domain form databse

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from './database.service'; // Import your database service

@Injectable()
export class DomainFilterMiddleware implements NestMiddleware {
  constructor(private readonly databaseService: DatabaseService) {} // Inject your database service

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Fetch allowed domains from the database
      const allowedDomains = await this.databaseService.getAllowedDomains();

      const origin = req.header('Origin');

      if (allowedDomains.includes(origin)) {
        // Allow the request to continue
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        next();
      } else {
        // Deny the request
        res.status(403).send('Forbidden');
      }
    } catch (error) {
      console.error('Error fetching allowed domains from the database:', error);
      res.status(500).send('Internal Server Error');
    }
  }
}
```

## Install Sequelize and PostgreSQL Dependencies

```bash
npm install sequelize pg
```

```ts

// database.service.ts

import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { DomainModel } from './domain.model'; // Create a Sequelize model for your domains

@Injectable()
export class DatabaseService {
  constructor(private readonly sequelize: Sequelize) {}

  async getAllowedDomains(): Promise<string[]> {
    try {
      // Assuming you have a DomainModel for your domains
      const domains = await DomainModel.findAll({ attributes: ['domain'] });

      // Extract the domain values from the result
      const allowedDomains = domains.map((domain) => domain.domain);

      return allowedDomains;
    } catch (error) {
      throw new Error(`Error fetching allowed domains: ${error.message}`);
    }
  }
}
```
## Create a Sequelize Model for Domains:

```ts
// domain.model.ts

import { Model, Column, Table } from 'sequelize-typescript';

@Table
export class DomainModel extends Model<DomainModel> {
  @Column
  domain: string;
}
```
## Configure Sequelize in Your Application

```ts
// main.ts or your module

import { Sequelize } from 'sequelize-typescript';
import { DatabaseService } from './database.service';
import { DomainModel } from './domain.model';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'your-database-host',
  port: 5432,
  username: 'your-username',
  password: 'your-password',
  database: 'your-database',
});

sequelize.addModels([DomainModel]);

const app = await NestFactory.create(AppModule);
app.useGlobalFilters(new AllExceptionsFilter());

const databaseService = new DatabaseService(sequelize);

app.useGlobalInterceptors(new ResponseTransformInterceptor());
app.useGlobalPipes(new ValidationPipe());

await app.listen(3000);
```



## you can find request header from frontend nextjs

```ts
// pages/some-page.js

import Cookies from 'cookies'; // You may need to install this package

export async function getServerSideProps(context) {
  const { req, res } = context;

  // Extract the host from the request headers
  const host = req.headers.host || '';

  // Split the host by dot to extract subdomain/domain
  const parts = host.split('.');

  // Extract subdomain and domain
  const subdomain = parts.length > 2 ? parts[0] : null;
  const domain = parts.length > 1 ? parts.slice(1).join('.') : parts[0];

  // Set the subdomain or domain in a cookie
  const cookies = new Cookies(req, res);
  cookies.set('tenantSubdomain', subdomain);
  cookies.set('tenantDomain', domain);

  return {
    props: {
      subdomain,
      domain,
    },
  };
}

function SomePage({ subdomain, domain }) {
  return (
    <div>
      <h1>Subdomain: {subdomain}</h1>
      <h1>Domain: {domain}</h1>
    </div>
  );
}

export default SomePage;
```


## Extract the domain name from a URL string in Node.js

```bash 
yarn add url --save
```

```ts

const url = require('url');

const urlString = "http://tenant.crm.co";
const parsedUrl = new URL(urlString);

// Get the domain name
const domainName = parsedUrl.hostname;
console.log(domainName); // Output: "tenant.crm.co"

```



