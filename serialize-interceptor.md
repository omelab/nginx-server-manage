## Serializer Interceptor

If the nested property is an array of objects, you can modify the removeKeys method to handle arrays as well. Here's an updated version of the SerializeInterceptor to support nested arrays:

```ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private keys: string[]) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Run before the route handler
    console.log('Before...');

    // Get the response object
    const response = context.switchToHttp().getResponse();

    // Use RxJS map operator to transform the response
    return next.handle().pipe(
      map((data) => {
        // Check if the response is an object
        if (data && typeof data === 'object') {
          // Remove specified keys, including nested properties and arrays
          this.removeKeys(data, this.keys);
        }

        // Run after the route handler
        console.log('After...');

        return data;
      }),
    );
  }

  private removeKeys(obj: any, keys: string[]) {
    if (Array.isArray(obj)) {
      // If it's an array, apply the removeKeys method to each element
      obj.forEach((item) => this.removeKeys(item, keys));
    } else if (typeof obj === 'object') {
      // If it's an object, remove specified keys and apply the removeKeys method to nested properties
      for (const key of keys) {
        if (obj.hasOwnProperty(key)) {
          delete obj[key];
        }
      }

      for (const prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          this.removeKeys(obj[prop], keys);
        }
      }
    }
  }
}
```

Now, the removeKeys method will handle both nested properties and arrays. You can use it in the same way as before:


```ts

import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { SerializeInterceptor } from './serialize.interceptor';

@Controller('example')
@UseInterceptors(new SerializeInterceptor(['password', 'id']))
export class ExampleController {
  @Get()
  getData() {
    return {
      username: 'john_doe',
      password: 'secret',
      token: 'some_token',
      age: 30,
      profile: [{ id: 1, bio: 'string' }],
    };
  }
}

```