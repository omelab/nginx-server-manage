## About this project



## System Architect



## Project initialization

create api project with nest js by flowing this command:

```bash
nest new multi-tannent-app
```
install dependencies:

```bash
yarn add @nestjs/sequelize sequelize sequelize-typescript sequelize-cli mysql2 passport passport-local bcrypt
yarn add @types/sequelize  --save-dev


#-- or if you use postgresql--
yarn add @nestjs/sequelize sequelize sequelize-typescript sequelize-cli pg pg-hstore passport passport-local bcrypt
yarn add @types/sequelize  --save-dev

```

create Sequelize Configuration: [click her](https://docs.nestjs.com/techniques/database#sequelize-integration) to learn sequelize integration
also if you can learn about [migration](https://sequelize.org/v5/manual/migrations.html#the-cli) from here

```ts

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    }),
  ],
})
export class AppModule {}
```
if you want to cinfig root level :

```ts
// src/sequelize.config.ts
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize({
  dialect: 'postgres', // Use the PostgreSQL dialect
  host: 'localhost',
  username: 'your_username',
  password: 'your_password',
  database: 'your_database_name',
  models: [__dirname + '/**/*.model.ts'], // Include all your model files
});

```

if you are using mysql:

```ts
// src/sequelize.config.ts
import { Sequelize } from 'sequelize-typescript';

export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  username: 'your_username',
  password: 'your_password',
  database: 'your_database_name',
  models: [__dirname + '/**/*.model.ts'], // Include all your model files
});
```


## Basic Authentication

you can create module, controller, services by nest cli command like: ``` nest generate module <module-name> ```
so now we are create module by this command : ```nest generate module users ``` you can create controller and service like: ``` nest generate module <controller-name> ``` and ``` nest generate module <service-name> ```

Create a User Model:

```ts
// src/users/user.model.ts
import { Model, Table, Column, DataType } from 'sequelize-typescript';

@Table({
  timestamps: true,
})
export class User extends Model<User> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  username: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;
}
```



## Multi-tannent Configure
drizzle


[prisma-multi-tanent](https://www.npmjs.com/package/prisma-multi-tenant)
[multi tennant package](https://www.npmjs.com/package/sequelizemultitenantmodule)
[help](https://medium.com/@hzburki/nestjs-getting-started-with-sequilizejs-c1ae253410e8)
[help-sequilize config](https://www.freecodecamp.org/news/build-web-apis-with-nestjs-beginners-guide/)
[migration](https://devpress.csdn.net/postgresql/62f226177e66823466184b9c.html)
[beginners-guid](https://www.freecodecamp.org/news/build-web-apis-with-nestjs-beginners-guide/)
[help](https://www.youtube.com/watch?v=5rlsUfQTRzs&list=PLlameCF3cMEu8KAN-02n3CtToO5iYELTV)
[Dynamically created Sequelize Instance in NestJS](https://stackoverflow.com/questions/70385641/use-dynamically-created-sequelize-instance-in-nestjs)
[help](https://progressivecoder.com/how-to-setup-a-nestjs-sequelize-postgresql-integration/)


[graphql](https://trilon.io/blog/introducing-cli-generators-crud-api-in-1-minute)
[mocking](https://medium.com/@vivek.murarka/mocking-with-jest-in-typescript-javascript-d203699cc617)