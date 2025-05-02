## What is a Laravel Model?

A Model in Laravel is a class that represents a database table. Each model typically corresponds to one table and provides an abstraction layer for performing database operations (like CRUD) using Eloquent, Laravel's ORM (Object-Relational Mapping).

##  Basic Structure of a Model

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $table = 'posts'; // Optional if model name is same as table
    protected $fillable = ['title', 'content']; // For mass assignment
}

```



## CRUD Operations with Eloquent

```php
// Create
Post::create(['title' => 'My Title', 'content' => 'My Content']);

// Read
$post = Post::find(1);
$allPosts = Post::all();

// Update
$post->title = 'Updated';
$post->save();

// Delete
$post->delete();

```

## 🧩 Key Model Properties

__protected $table__
Overrides the default table name:

```php
protected $table = 'my_custom_table';
```



__protected $primaryKey__
Sets the primary key column:

```php
protected $primaryKey = 'uuid';
```



__public $timestamps__
Disables auto created_at and updated_at:

```php
public $timestamps = false;
```

__protected $fillable__
Allows mass assignment:

```php
protected $fillable = ['name', 'email'];
```



__protected $guarded__
Inverse of fillable, blocks listed fields:

```php
protected $guarded = ['admin'];
```


🧠 Attribute Casting

```php
protected $casts = [
    'is_active' => 'boolean',
    'settings' => 'json',
];
```
Casts attributes automatically when accessed/assigned.


📦 Eager Loading

```php
protected $with = ['comments', 'user'];
```
Auto-load relationships to avoid N+1 query issues.



📚 Relationships
Laravel makes defining relationships easy:

- One to One

```php
public function profile()
{
    return $this->hasOne(Profile::class);
}

```


- One to Many

```php
public function comments()
{
    return $this->hasMany(Comment::class);
}

```

- Many to Many

```php

public function roles()
{
    return $this->belongsToMany(Role::class);
}


```

- Inverse

```php
public function user()
{
    return $this->belongsTo(User::class);
}

```

- Has Many Through

```php
public function posts()
{
    return $this->hasManyThrough(Post::class, User::class);
}

```

🧰 Accessors & Mutators

Accessor (get formatted value)

```php
public function getFullNameAttribute()
{
    return "{$this->first_name} {$this->last_name}";
}

```

Use: $user->full_name

Mutator (set formatted value)

```php
public function setPasswordAttribute($value)
{
    $this->attributes['password'] = bcrypt($value);
}

```

🧠 Scopes

- Local Scope

```php
public function scopeActive($query)
{
    return $query->where('is_active', 1);
}

```


- Global Scope

```php
protected static function booted()
{
    static::addGlobalScope('order', function ($query) {
        $query->orderBy('created_at', 'desc');
    });
}
```


🔄 Events & Observers


```php

protected static function booted()
{
    static::creating(function ($model) {
        // logic before saving
    });
}

```

Use observers for cleaner logic separation.

🛡️ Soft Deletes

```php
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;
}
```

Also, add deleted_at column to table.


📜 Example Model: Order

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    // Optional: Specify custom table name
    protected $table = 'orders';

    // Mass assignable attributes
    protected $fillable = [
        'user_id',
        'status',
        'total',
        'shipping_address',
        'billing_address',
        'payment_intent_info',
    ];

    // Hidden from array/JSON outputs
    protected $hidden = [
        'payment_intent_info',
    ];

    // Shown in array/JSON (optional if you want fine control)
    protected $visible = [
        'id',
        'user_id',
        'status',
        'total',
        'shipping_address',
        'billing_address',
        'created_at',
    ];

    // Attribute casting
    protected $casts = [
        'shipping_address' => 'array',
        'billing_address' => 'array',
        'payment_intent_info' => 'json',
        'total' => 'decimal:2',
    ];

    // Date columns including soft deletes
    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    // Global scopes (e.g. default order by latest)
    protected static function booted()
    {
        static::addGlobalScope('order', function (Builder $builder) {
            $builder->orderBy('created_at', 'desc');
        });
    }

    // Relationships

    // An order belongs to a user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // An order has many products (via pivot)
    public function products()
    {
        return $this->belongsToMany(Product::class)->withPivot('quantity', 'price');
    }

    // Example of nested eager loading
    protected $with = ['user', 'products.variationOptions'];

    // Accessor: Format total as currency
    public function getFormattedTotalAttribute(): string
    {
        return '$' . number_format($this->total, 2);
    }

    // Mutator: Ensure status is always uppercase
    public function setStatusAttribute($value)
    {
        $this->attributes['status'] = strtoupper($value);
    }
}


```

💡 How to Use This Model

```php
$order = Order::with('products')->find(1);

echo $order->formatted_total; // Access accessor
echo $order->shipping_address['city']; // JSON cast

```


🔁 Model Relationships Recap

- belongsTo(User::class) → One user per order

- belongsToMany(Product::class) → Pivot table like order_product

- Eager loading with $with or ->with() to avoid N+1 queries

 


🧪 Testing / Factory
 

Laravel provides factories to generate fake data:

```php
Order::factory()->count(10)->create();

```


