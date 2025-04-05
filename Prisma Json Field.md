## Prisma Schema with a Json Field

In Prisma, a Json field allows you to store structured JSON data directly in your database. It can hold any valid JSON object, array, or value. Here's how you can define a Json field in your Prisma schema and work with it.

### Prisma Schema with a Json Field

```prisma
model User {
  id        Int     @id @default(autoincrement())
  name      String
  metadata  Json?   // Optional JSON field
  createdAt DateTime @default(now())
}
```


### Working with JSON Fields

You can interact with the Json field by assigning JSON objects or arrays to it, just like you would with any other field.

- Inserting a JSON Value:

```ts
const user = await prisma.user.create({
  data: {
    name: 'John Doe',
    metadata: { age: 30, preferences: { theme: 'dark' } },
  },
});
```

- Querying a JSON Field:

```ts
const user = await prisma.user.findMany({
  where: {
    metadata: {
      path: ['preferences', 'theme'],
      equals: 'dark',
    },
  },
});
```

- Updating a JSON Field:

```ts
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: {
    metadata: { age: 31, preferences: { theme: 'light' } },
  },
});

```


