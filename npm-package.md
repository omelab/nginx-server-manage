# NPM Package help

1️⃣ Ensure your package.json is ready

Make sure your package.json has the correct version, name, description, and main/module entry.

Example:

```json
{
  "name": "@easysofts/id-logic",
  "version": "1.0.1",  // increment version
  "description": "ID generation module for NestJS using Sequelize",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["nestjs", "sequelize", "id-generator", "unique-id"],
  "author": "Abu Bakar Siddique",
  "license": "MIT",
  "dependencies": {
    "luxon": "^3.0.0",
    "sequelize": "^6.35.0",
    "sequelize-typescript": "^2.1.0",
    "@nestjs/common": "^11.0.0"
  }
}

```



2️⃣ Update the version

	- npm requires a new version for updates.
	- Use semantic versioning:

```bash
# Patch (bug fix / README update)
npm version patch

# Minor (new feature)
npm version minor

# Major (breaking change)
npm version major
```

> Example for README update: ```bash npm version patch```


3️⃣ Build your package (if using TypeScript)

```bash 
npm run build 

```

	- This generates the dist/ folder.
	- Make sure your package.json points to "main": "dist/index.js".

4️⃣ Login to npm (if not already)

```bash 
npm login

```

- Enter your npm username, password, and email.



5️⃣ Publish the updated package

```bash 
npm publish --access public 

```


`--access public` is required for scoped packages `(@easysofts/...)` to be public.


✅ After publishing

	- Go to your npm package page: https://www.npmjs.com/package/@easysofts/id-logic
	- Your updated README.md will now be displayed automatically.
	- Users installing the package will see your updated documentation.


