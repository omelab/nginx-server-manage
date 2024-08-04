# PayPal Payment with rmklive/paypal
Integrate PayPal authorization and reauthorization using the srmklive/paypal package in a Laravel application, follow these steps:

### 1. Install the Package
First, add the srmklive/paypal package to your Laravel project using Composer:

```bash
composer require srmklive/paypal
```



### 2. Configuration
Publish the PayPal configuration file and add your PayPal credentials:

```bash
php artisan vendor:publish --provider="Srmklive\PayPal\Providers\PayPalServiceProvider"
```
In config/paypal.php, configure your PayPal client ID, secret, and mode:

```php
return [
    'mode'    => env('PAYPAL_MODE', 'sandbox'), // Can be 'sandbox' or 'live'
    'sandbox' => [
        'client_id'         => env('PAYPAL_SANDBOX_CLIENT_ID', ''),
        'client_secret'     => env('PAYPAL_SANDBOX_CLIENT_SECRET', ''),
        'app_id'            => '',
    ],
    'live' => [
        'client_id'         => env('PAYPAL_LIVE_CLIENT_ID', ''),
        'client_secret'     => env('PAYPAL_LIVE_CLIENT_SECRET', ''),
        'app_id'            => '',
    ],
    'payment_action' => 'Sale', // Can be 'Sale', 'Authorization' or 'Order'
    'currency'       => env('PAYPAL_CURRENCY', 'USD'),
    'billing_type'   => 'MerchantInitiatedBilling',
    'notify_url'     => '', // Change this accordingly for your application.
    'locale'         => '',
    'validate_ssl'   => true,
];
```

In your .env file, add the corresponding keys:
```env 
PAYPAL_MODE=sandbox
PAYPAL_SANDBOX_CLIENT_ID=your_sandbox_client_id
PAYPAL_SANDBOX_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_LIVE_CLIENT_ID=your_live_client_id
PAYPAL_LIVE_CLIENT_SECRET=your_live_client_secret
PAYPAL_CURRENCY=USD
```


### 3. PayPal Service
Create a service to handle PayPal requests. You can create a service class in app/Services/PayPalService.php:

```php
namespace App\Services;

use Srmklive\PayPal\Services\PayPal as PayPalClient;

class PayPalService
{
    protected $payPalClient;

    public function __construct()
    {
        $this->payPalClient = new PayPalClient;
        $this->payPalClient->setApiCredentials(config('paypal'));
        $this->setAccessToken();
    }

    protected function setAccessToken()
    {
        $access_token = $this->payPalClient->getAccessToken();

        abort_if(isset($access_token['type']) && $access_token['type'] === 'error', 405, $access_token['message'] ?? '');

        $this->payPalClient->setAccessToken($access_token);
    }

    public function createPayment(array $paymentDetails)
	{
	    $orderData = [
	        "intent" => strtoupper($paymentDetails['payment_type']), // 'AUTHORIZE' or 'CAPTURE'
	        "purchase_units" => [
	            [
	                "amount" => [
	                    "currency_code" => $paymentDetails['currency'],
	                    "value" => $paymentDetails['amount']
	                ],
	                "description" => $paymentDetails['description'],
	                "custom_id" => (string)$paymentDetails['order_id'],
	                "invoice_id" => (string)$paymentDetails['track'],
	                "payee" => [
	                    "email_address" => $paymentDetails['email'],
	                ],
	            ]
	        ],
	        "application_context" => [
	            "return_url" => $paymentDetails['success_url'],
	            "cancel_url" => $paymentDetails['cancel_url'],
	            "brand_name" => $paymentDetails['title'],
	            "locale" => "en-US",
	            "landing_page" => "BILLING",
	            "shipping_preference" => "NO_SHIPPING",
	            "user_action" => "PAY_NOW",
	        ]
	    ];

	    // Log the order data for debugging
	    \Log::info('PayPal Order Data:', $orderData);

	    $payment = $this->payPalClient->createOrder($orderData);

	    if (isset($payment['error'])) {
	        abort(405, $payment['error']['message'] ?? 'Unknown error');
	    }

	    return $payment;
	}

     public function capturePayment($orderId)
    {
        $response = $this->payPalClient->capturePaymentOrder($orderId);

        return $response;
    }

    public function reAuthorizePayment($authorizationId, $total, $currency)
    {
        $response = $this->payPalClient->authorizePaymentOrder($authorizationId, [
            "amount" => [
                "currency_code" => $currency,
                "value" => $total
            ]
        ]);

        return $response;
    }
}

```

### 4. Create Payment and Handle Callback
In your controller, you can now create a payment and handle the callback after the user approves or cancels the payment:

```php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PayPalService;

class PayPalController extends Controller
{
    protected $payPalService;

    public function __construct(PayPalService $payPalService)
    {
        $this->payPalService = $payPalService;
    }

    public function createPayment(Request $request)
    {
         $paymentDetails = [
            "title" => "Payment for order",
            "name" => "Admin of the system",
            "email" => "shamim@m4yours.com",
            "description" => "Payment For Order Id: #520 Package Name: Payer Name: Admin of the system Payer Email: shamim@m4yours.com",
            "amount" => "3092.52",
            "order_id" => 520,
            "track" => "MpLYUqA9EgSISkaCvtOK",
            "payment_type" => "AUTHORIZE",
            "currency" => "USD",
            "ipn_url" => "http://watanabe.test/product-paypal-ipn",
            "success_url" => "http://watanabe.test/product/success/V56AQc520KOxtaf",
            "cancel_url" => "http://watanabe.test/product/cancel/kNsK9M520b9yNTz",
            "shipping_preference" => "NO_SHIPPING" // ADD THIS FIELD
        ];

        $payment = $this->payPalService->createPayment($paymentDetails);
        return redirect($payment['links'][1]['href']);
    }

    public function handleCallback(Request $request)
    {
        $token = $request->input('token');
        $payerId = $request->input('PayerID');

        $payment = $this->payPalService->capturePayment($token);

        // Handle payment success logic here

        return redirect('/success');
    }

    public function handleIpn(Request $request)
    {
        $ipnData = $request->all();
        // Validate IPN data with PayPal and handle your business logic
    }
}

```

### 5. Routes
Define routes for creating the payment and handling the callback in your routes/web.php:

```php 
use App\Http\Controllers\PayPalController;

Route::get('create-payment', [PayPalController::class, 'createPayment'])->name('createPayment');
Route::get('status', [PayPalController::class, 'handleCallback'])->name('paymentStatus');
Route::post('product-paypal-ipn', [PayPalController::class, 'handleIpn'])->name('productPaypalIpn');

```

### 6. Reauthorization
To reauthorize a payment, you can add a method in your controller:

```php 
public function reauthorizePayment($authorizationId)
{
    $reauthorization = $this->payPalService->reAuthorizePayment($authorizationId, 10.00, 'USD');

    // Handle reauthorization success logic here

    return redirect('/reauthorization-success');
}
```

And add a corresponding route:

```php 
Route::get('reauthorize-payment/{authorizationId}', [PayPalController::class, 'reauthorizePayment'])->name('reauthorizePayment');

```



also if you want to share items on payment

```php
namespace App\Services;

use Srmklive\PayPal\Services\PayPal as PayPalClient;

class PayPalService
{
    protected $payPalClient;

    public function __construct()
    {
        $this->payPalClient = new PayPalClient;
        $this->payPalClient->setApiCredentials(config('paypal'));

        $this->initializeAccessToken();
    }

    protected function initializeAccessToken()
    {
        $access_token = $this->payPalClient->getAccessToken();

        if (isset($access_token['type']) && $access_token['type'] === 'error') {
            abort(405, $access_token['message'] ?? 'Unknown error');
        }

        $this->payPalClient->setAccessToken($access_token['access_token']);
    }

    public function createPayment(array $paymentDetails)
    {
        $orderData = [
            "intent" => strtoupper($paymentDetails['payment_type']), // 'AUTHORIZE' or 'CAPTURE'
            "purchase_units" => [
                [
                    "amount" => [
                        "currency_code" => $paymentDetails['currency'],
                        "value" => $paymentDetails['amount'],
                        "breakdown" => [
                            "item_total" => [
                                "currency_code" => $paymentDetails['currency'],
                                "value" => $paymentDetails['amount']
                            ]
                        ]
                    ],
                    "description" => $paymentDetails['description'],
                    "custom_id" => (string)$paymentDetails['order_id'],
                    "invoice_id" => (string)$paymentDetails['track'],
                    "payee" => [
                        "email_address" => $paymentDetails['email'],
                    ],
                    "items" => [
                        [
                            "name" => $paymentDetails['title'],
                            "unit_amount" => [
                                "currency_code" => $paymentDetails['currency'],
                                "value" => $paymentDetails['amount']
                            ],
                            "quantity" => "1",
                            "category" => "DIGITAL_GOODS"
                        ]
                    ]
                ]
            ],
            "application_context" => [
                "return_url" => $paymentDetails['success_url'],
                "cancel_url" => $paymentDetails['cancel_url'],
                "brand_name" => $paymentDetails['title'],
                "locale" => "en-US",
                "landing_page" => "BILLING",
                "shipping_preference" => $paymentDetails['shipping_preference'], // ADD THIS FIELD
                "user_action" => "PAY_NOW",
            ]
        ];

        // Log the order data for debugging
        \Log::info('PayPal Order Data:', $orderData);

        $payment = $this->payPalClient->createOrder($orderData);

        if (isset($payment['error'])) {
            abort(405, $payment['error']['message'] ?? 'Unknown error');
        }

        return $payment;
    }

    public function capturePayment($orderId)
    {
        $response = $this->payPalClient->capturePaymentOrder($orderId);

        return $response;
    }

    public function reAuthorizePayment($authorizationId, $total, $currency)
    {
        $response = $this->payPalClient->authorizePaymentOrder($authorizationId, [
            "amount" => [
                "currency_code" => $currency,
                "value" => $total
            ]
        ]);

        return $response;
    }
}
```







# Paypal payment using paypal/rest-api-sdk-php

### 1. Install the PayPal PHP SDK
First, add the PayPal PHP SDK to your Laravel project using Composer:

```bash
composer require paypal/rest-api-sdk-php
```


### 2. Configuration
Create a PayPal configuration file. You can generate the configuration file using the command:

```bash
php artisan vendor:publish --provider="Srmklive\PayPal\Providers\PayPalServiceProvider"
```


In config/paypal.php, configure your PayPal client ID, secret, and mode:

```php
return [
    'mode'    => env('PAYPAL_MODE', 'sandbox'), // Can be 'sandbox' or 'live'
    'sandbox' => [
        'client_id'         => env('PAYPAL_SANDBOX_CLIENT_ID', ''),
        'client_secret'     => env('PAYPAL_SANDBOX_CLIENT_SECRET', ''),
        'app_id'            => '',
    ],
    'live' => [
        'client_id'         => env('PAYPAL_LIVE_CLIENT_ID', ''),
        'client_secret'     => env('PAYPAL_LIVE_CLIENT_SECRET', ''),
        'app_id'            => '',
    ],
    'payment_action' => 'Sale', // Can be 'Sale', 'Authorization' or 'Order'
    'currency'       => env('PAYPAL_CURRENCY', 'USD'),
    'billing_type'   => 'MerchantInitiatedBilling',
    'notify_url'     => '', // Change this accordingly for your application.
    'locale'         => '',
    'validate_ssl'   => true,
];
```



In your .env file, add the corresponding keys:

```env
PAYPAL_MODE=sandbox
PAYPAL_SANDBOX_CLIENT_ID=your_sandbox_client_id
PAYPAL_SANDBOX_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_LIVE_CLIENT_ID=your_live_client_id
PAYPAL_LIVE_CLIENT_SECRET=your_live_client_secret
PAYPAL_CURRENCY=USD
```



### 3. PayPal Service
Create a service to handle PayPal requests. You can create a service class in app/Services/PayPalService.php:

```php
namespace App\Services;

use PayPal\Api\Amount;
use PayPal\Api\Authorization;
use PayPal\Api\Payer;
use PayPal\Api\Payment;
use PayPal\Api\PaymentExecution;
use PayPal\Api\Transaction;
use PayPal\Api\RedirectUrls;
use PayPal\Api\ReAuthorization;
use PayPal\Auth\OAuthTokenCredential;
use PayPal\Rest\ApiContext;

class PayPalService
{
    protected $apiContext;

    public function __construct()
    {
        $this->apiContext = new ApiContext(
            new OAuthTokenCredential(
                config('paypal.sandbox.client_id'),
                config('paypal.sandbox.client_secret')
            )
        );
        $this->apiContext->setConfig(config('paypal.settings'));
    }

    public function createPayment($total, $currency, $paymentDescription)
    {
        $payer = new Payer();
        $payer->setPaymentMethod("paypal");

        $amount = new Amount();
        $amount->setTotal($total);
        $amount->setCurrency($currency);

        $transaction = new Transaction();
        $transaction->setAmount($amount);
        $transaction->setDescription($paymentDescription);

        $redirectUrls = new RedirectUrls();
        $redirectUrls->setReturnUrl(url('status'))
                     ->setCancelUrl(url('status'));

        $payment = new Payment();
        $payment->setIntent("authorize")
                ->setPayer($payer)
                ->setRedirectUrls($redirectUrls)
                ->setTransactions([$transaction]);

        try {
            $payment->create($this->apiContext);
        } catch (\Exception $ex) {
            throw new \Exception("Unable to create link for payment: " . $ex->getMessage());
        }

        return $payment;
    }

    public function executePayment($paymentId, $payerId)
    {
        $payment = Payment::get($paymentId, $this->apiContext);

        $execution = new PaymentExecution();
        $execution->setPayerId($payerId);

        try {
            $result = $payment->execute($execution, $this->apiContext);
        } catch (\Exception $ex) {
            throw new \Exception("Unable to execute payment: " . $ex->getMessage());
        }

        return $result;
    }

    public function reAuthorize($authorizationId, $total, $currency)
    {
        $authorization = Authorization::get($authorizationId, $this->apiContext);

        $amount = new Amount();
        $amount->setTotal($total);
        $amount->setCurrency($currency);

        $reauthorization = new ReAuthorization();
        $reauthorization->setAmount($amount);

        try {
            $authorization->reauthorize($this->apiContext, $reauthorization);
        } catch (\Exception $ex) {
            throw new \Exception("Unable to reauthorize payment: " . $ex->getMessage());
        }

        return $reauthorization;
    }
}
```


### 4. Create Payment and Handle Callback

In your controller, you can now create a payment and handle the callback after the user approves or cancels the payment:

```php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PayPalService;

class PayPalController extends Controller
{
    protected $payPalService;

    public function __construct(PayPalService $payPalService)
    {
        $this->payPalService = $payPalService;
    }

    public function createPayment()
    {
        $payment = $this->payPalService->createPayment(10.00, 'USD', 'Payment Description');
        return redirect($payment->getApprovalLink());
    }

    public function handleCallback(Request $request)
    {
        if ($request->has('paymentId') && $request->has('PayerID')) {
            $paymentId = $request->input('paymentId');
            $payerId = $request->input('PayerID');
            $payment = $this->payPalService->executePayment($paymentId, $payerId);

            // Handle payment success logic here

            return redirect('/success');
        }

        // Handle payment cancellation logic here

        return redirect('/cancel');
    }
}
```


### 5. Routes

Define routes for creating the payment and handling the callback in your routes/web.php:

```php
use App\Http\Controllers\PayPalController;

Route::get('create-payment', [PayPalController::class, 'createPayment'])->name('createPayment');
Route::get('status', [PayPalController::class, 'handleCallback'])->name('paymentStatus');
```

### 6. Reauthorization
To reauthorize a payment, you can add a method in your controller:

```php 
public function reauthorizePayment($authorizationId)
{
    $reauthorization = $this->payPalService->reAuthorize($authorizationId, 10.00, 'USD');

    // Handle reauthorization success logic here

    return redirect('/reauthorization-success');
}

```


And add a corresponding route:

```php 
Route::get('reauthorize-payment/{authorizationId}', [PayPalController::class, 'reauthorizePayment'])->name('reauthorizePayment');
```









