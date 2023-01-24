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
```
 
 