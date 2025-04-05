##  Square Payment

To implement Square Payment Gateway with your Laravel project, follow these steps:


To implement Square Payment Gateway with your Laravel project, follow these steps:

### Step 1: Install Square SDK
You need to install the Square PHP SDK using Composer. Run the following command in your Laravel project directory:

```bash
composer require square/square
```

### Step 2: Get Your Square Credentials
Go to the [Square Developer Dashboard](https://developer.squareup.com/us/en) and create an application.
Get your [Application ID](https://developer.squareup.com/console/en/apps), Access Token, and Location ID.


### Step 3: Configure Environment Variables
Add the following variables to your .env file using your credentials from the Square Developer Dashboard:

```bash
SQUARE_APPLICATION_ID=your-application-id
SQUARE_ACCESS_TOKEN=your-access-token
SQUARE_LOCATION_ID=your-location-id
SQUARE_ENVIRONMENT=sandbox # Use 'production' for live mode
```


### Step 4. Set Up Configuration
Create a configuration file for Square. You can use the following command to generate a new config file:

Add the following configuration in config/square.php:

```php 
'square' => [
    'access_token' => env('SQUARE_ACCESS_TOKEN'),
    'application_id' => env('SQUARE_APPLICATION_ID'),
    'location_id' => env('SQUARE_LOCATION_ID'),
    'environment' => env('SQUARE_ENVIRONMENT', 'sandbox'),
],
```  


### Step 5. Create a Square Service
Create a service class to handle Square payments. You can place this in app/Services/SquareService.php:


```php
<?php

namespace App\Services;

use Square\SquareClient;
use Square\Models\Money;
use Square\Models\CreatePaymentRequest;
use Exception;

class SquareService
{
    protected $client;

    public function __construct()
    {
        $this->client = new SquareClient([
            'accessToken' => config('square.access_token'),
            'environment' => config('square.environment'), // sandbox or production
        ]);
    }

    public function processPayment($nonce, $amount)
    {
        $paymentsApi = $this->client->getPaymentsApi();

        $money = new Money();
        $money->setAmount($amount); // Amount in cents (e.g., $5.00 is 500)
        $money->setCurrency('USD');

        $createPaymentRequest = new CreatePaymentRequest(
            $nonce,                // Payment nonce from the frontend
            uniqid()               // Idempotency key (a unique identifier for the request)
        );
        
        // Set the amount and currency in the request body
        $createPaymentRequest->setAmountMoney($money);

        try {
            $response = $paymentsApi->createPayment($createPaymentRequest);
            if ($response->isSuccess()) {
                return $response->getResult()->getPayment();
            } else {
                $errors = $response->getErrors();
                throw new Exception('Payment failed: ' . $errors[0]->getDetail());
            }
        } catch (Exception $e) {
            throw new Exception('Payment processing error: ' . $e->getMessage());
        }
    }
}
```


### Step 6. Create the Payment Form

Create a Blade view for your payment form in resources/views/payment.blade.php:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment</title>
    <script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
</head>
<body>
    <h1>Payment</h1>
    <form id="payment-form">
        <div id="card-container"></div>
        <button type="submit">Pay</button>
    </form>

    <script>
        const applicationId = "{{ config('square.application_id') }}";
        const environment = "{{ config('square.environment', 'sandbox') }}";

        const payments = window.Square.payments(applicationId, environment);

        const card = await payments.card();
        await card.attach('#card-container');

        const form = document.getElementById('payment-form');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const {token, error} = await card.tokenize();

            if (error) {
                console.error('Tokenization failed', error);
                return;
            }

            const formData = new FormData();
            formData.append('nonce', token);
            formData.append('amount', '500'); // Amount in cents, e.g., $5.00

            fetch('/process-payment', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            }).then(response => response.json())
              .then(data => {
                  if (data.success) {
                      alert('Payment successful!');
                  } else {
                      alert('Payment failed: ' + data.error);
                  }
              });
        });
    </script>
</body>
</html>
```

### step 7. Create a Controller to Handle Payment Processing

Create a controller to handle the payment request in `app/Http/Controllers/PaymentController.php`:


```bash
php artisan make:controller PaymentController
```

In PaymentController.php:

```php
<?php

<?php

namespace App\Http\Controllers;

use App\Services\SquareService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    protected $squareService;

    public function __construct(SquareService $squareService)
    {
        $this->squareService = $squareService;
    }

    public function showPaymentForm()
    {
        return view('payment');
    }

    public function processPayment(Request $request)
    {
        $nonce = $request->input('nonce');
        $amount = $request->input('amount');

        try {
            $payment = $this->squareService->processPayment($nonce, $amount);
            return response()->json(['success' => true, 'payment' => $payment]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}
```

### Step 8. Define Routes

Add routes to routes/web.php: 

```php
use App\Http\Controllers\PaymentController;

Route::get('/payment', [PaymentController::class, 'showPaymentForm']);
Route::post('/process-payment', [PaymentController::class, 'processPayment']);
```
 



### Step 9. Include the Square Web Payments SDK

First, add the Web Payments SDK to your HTML file. You can include it in your <head> tag like so:

```html
<script type="text/javascript" src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
```

For production, use:
```html
<script type="text/javascript" src="https://web.squarecdn.com/v1/square.js"></script>
```

### Create the Payment Form

Create a basic HTML form for collecting the payment:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Square Payment Form</title>
    <script type="text/javascript" src="https://sandbox.web.squarecdn.com/v1/square.js"></script> <!-- Use sandbox for testing -->
</head>
<body>
    <h1>Square Payment</h1>

    <div id="payment-form-container">
        <div id="card-container"></div> <!-- Square will render the card payment fields here -->
        <button id="card-button" type="button">Pay</button>
    </div>

    <script>
        async function initializeSquare() {
            if (!window.Square) {
                alert("Square payments SDK failed to load!");
                return;
            }

            const payments = window.Square.payments('your-square-application-id', 'sandbox'); // or 'production' for live
            const card = await payments.card();
            await card.attach('#card-container');

            // Add a listener to your button for payment submission
            document.getElementById('card-button').addEventListener('click', async function() {
                try {
                    const tokenResult = await card.tokenize();
                    if (tokenResult.status === 'OK') {
                        processPayment(tokenResult.token); // Proceed to process the payment
                    } else {
                        console.error("Tokenization failed.");
                    }
                } catch (e) {
                    console.error("Error occurred while tokenizing card details:", e);
                }
            });
        }

        // Function to send payment nonce to your Laravel backend
        async function processPayment(token) {
            const response = await fetch('/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}', // For Laravel CSRF protection
                },
                body: JSON.stringify({
                    nonce: token,
                    amount: 1000, // Example: 1000 cents = $10.00
                }),
            });

            const result = await response.json();

            if (result.success) {
                alert('Payment successful!');
            } else {
                alert('Payment failed: ' + result.message);
            }
        }

        initializeSquare(); // Initialize the Square payment form
    </script>
</body>
</html>
```
 
###   Styling the Form (Optional)

You can style the form to make it look better using CSS. Here’s an example:

```css
<style>
    #payment-form-container {
        max-width: 400px;
        margin: auto;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    #card-container {
        margin-bottom: 20px;
    }

    #card-button {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 10px;
        width: 100%;
        font-size: 18px;
        cursor: pointer;
    }

    #card-button:hover {
        background-color: #0056b3;
    }
</style>
```

