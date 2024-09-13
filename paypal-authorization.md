# Create Paypal Authorization with Laravel

To use the srmklive/laravel-paypal package for authorizing, reauthorizing, and capturing payments in Laravel, you can follow these steps:


### 1. Install the Package

If you haven't already installed the package, you can do so via Composer:

```bash
composer require srmklive/paypal
```


### 2. Configure PayPal Credentials
Publish the configuration file and set your PayPal credentials in the `.env` file:

```bash
php artisan vendor:publish --provider="Srmklive\PayPal\Providers\PayPalServiceProvider"
```

In your `.env` file, add:

```env
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_SANDBOX_MODE=true # Set to false for live environment
```



### 3. Setup PayPal Service

You can create a service class to handle PayPal-related operations. Below is an example service class to authorize, reauthorize, and capture payments:

```php
namespace App\PaymentGateway\Gateways;

use Srmklive\PayPal\Services\PayPal as PayPalClient;

use App\Product\ProductSellInfo;


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

    public function createAndAuthorizePayment(array $paymentDetails)
    {
        $orderData = [
            "intent" => "AUTHORIZE", // Authorizing payment intent
            "purchase_units" => [
                [
                    "amount" => [
                        "currency_code" => $paymentDetails['currency'],
                        "value" => $paymentDetails['amount']
                    ],
                    "description" => $paymentDetails['description'],
                    "custom_id" => (string) $paymentDetails['order_id'],
                    "invoice_id" => (string) $paymentDetails['track'],
                    "payee" => [
                        "email_address" => $paymentDetails['email'],
                    ],
                ]
            ],
            "application_context" => [
                "return_url" => $paymentDetails['success_url'],
                "cancel_url" => $paymentDetails['cancel_url'],
                "notify_url" => $paymentDetails['ipn_url'],
                "brand_name" => $paymentDetails['title'],
                "locale" => "en-US",
                "landing_page" => "BILLING",
                "shipping_preference" => "NO_SHIPPING",
                "user_action" => "PAY_NOW",
            ]
        ];

        $order = $this->payPalClient->createOrder($orderData);

        abort_if(isset($order['type']) && $order['type'] === 'error', 405, $order['message'] ?? '');

        // Save the order ID and the authorization ID for later use
        $order_id = $order['id'];
     
        session()->put('paypal_order_id', $order_id); 
        session()->put('script_order_id', $paymentDetails['order_id']);

        $product_sell_info = ProductSellInfo::findOrFail($paymentDetails['order_id']);
        $product_sell_info->update([
            'paypal_order_id' => $order_id,
            'paypal_authorization_id' => $authorization_id, // Save authorization ID
        ]);

        $redirect_url = $order['links'][1]['href'];

        return redirect($redirect_url)->send();
    }



    public function authorizePayment($paypalOrderId)
    {
        $response = $this->payPalClient->authorizePaymentOrder($paypalOrderId);

        abort_if(isset($response['type']) && $response['type'] === 'error', 405, $response['message'] ?? '');

        return $response;
    }

    public function reAuthorizePayment($paypalOrderId, $total, $currency)
	{
	    $response = $this->payPalClient->reAuthorizeOrder($paypalOrderId, [
	        "amount" => [
	            "currency_code" => $currency,
	            "value" => $total
	        ]
	    ]);

	    abort_if(isset($response['type']) && $response['type'] === 'error', 405, $response['message'] ?? '');

	    return $response;
	}

	public function capturePayment($paypalOrderId)
	{
	    $response = $this->payPalClient->captureAuthorizedPaymentOrder($paypalOrderId);

	    abort_if(isset($response['type']) && $response['type'] === 'error', 405, $response['message'] ?? '');

	    return $response;
	}


    public function capturePayment($paypalOrderId)
    {
        $response = $this->payPalClient->capturePaymentOrder($paypalOrderId);

        abort_if(isset($response['type']) && $response['type'] === 'error', 405, $response['message'] ?? '');

        return $response;
    }

    /*
    public function reAuthorizePayment($paypalOrderId)
    {
        // Reauthorization may not be directly supported by the package, so you may need to make a custom request.
        $url = "https://api-m.sandbox.paypal.com/v2/payments/authorizations/{$paypalOrderId}/reauthorize";

        $response = $this->payPalClient->getHttpClient()->post($url, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->payPalClient->getAccessToken(),
                'Content-Type' => 'application/json',
            ],
        ]);

        $result = json_decode($response->getBody()->getContents(), true);

        abort_if(isset($result['type']) && $result['type'] === 'error', 405, $result['message'] ?? '');

        return $result;
    }*/
}
```


### 4. Usage in Controller
You can use the PayPalService in your controllers to handle payments:


```php
namespace App\Http\Controllers;

use App\PaymentGateway\Gateways\PayPalService;

use Illuminate\Http\Request;

class PaymentController extends Controller
{
    protected $payPalService;

    public function __construct(PayPalService $payPalService)
    {
        $this->payPalService = $payPalService;
    }

    public function createPayment(Request $request)
    {
        $paymentDetails = [
            'currency' => 'USD',
            'amount' => '100.00',
            'description' => 'Test Payment',
            'order_id' => 1,
            'track' => 'INV12345',
            'email' => 'customer@example.com',
            'success_url' => route('payment.success'),
            'cancel_url' => route('payment.cancel'),
            'ipn_url' => route('payment.ipn'),
            'title' => 'My Store',
        ];

        return $this->payPalService->createAndAuthorizePayment($paymentDetails); 
    }


    public function paymentSuccess(Request $request)
    {
        $orderId = session()->get('paypal_order_id');

        if (!$orderId) {
            return redirect()->route('home')->with('error', 'Order ID not found.');
        }

        $response = $this->payPalService->authorizePayment($orderId);

        if (isset($response['status']) && $response['status'] === 'COMPLETED') {
            return redirect()->route('home')->with('success', 'Payment authorized successfully.');
        }

        return redirect()->route('home')->with('error', 'Payment authorization failed.');
    }


    public function reAuthorizePayment(Request $request)
    {
        $orderId = session()->get('paypal_order_id');
        $total = '100.00'; // Amount to reauthorize
        $currency = 'USD';

        $response = $this->payPalService->reAuthorizePayment($orderId, $total, $currency);

        if (isset($response['status']) && $response['status'] === 'COMPLETED') {
            return redirect()->route('home')->with('success', 'Payment reauthorized successfully.');
        }

        return redirect()->route('home')->with('error', 'Payment reauthorization failed.');
    }


    public function capturePayment(Request $request)
    {
        $orderId = session()->get('paypal_order_id');

        $response = $this->payPalService->capturePayment($orderId);

        if (isset($response['status']) && $response['status'] === 'COMPLETED') {
            return redirect()->route('home')->with('success', 'Payment captured successfully.');
        }

        return redirect()->route('home')->with('error', 'Payment capture failed.');
    } 
 
}
```


### 5. Handling IPN (Instant Payment Notification)

You can handle PayPal IPNs by setting up a route to catch PayPal's IPN post requests and verify them:

```php
Route::get('/payment/create', [PaymentController::class, 'createPayment'])->name('payment.create');
Route::get('/payment/success', [PaymentController::class, 'paymentSuccess'])->name('payment.success');
Route::get('/payment/cancel', function() {
    return redirect()->route('home')->with('error', 'Payment was cancelled.');
})->name('payment.cancel');
Route::post('/payment/re-authorize', [PaymentController::class, 'reAuthorizePayment'])->name('payment.reauthorize');
Route::post('/payment/capture', [PaymentController::class, 'capturePayment'])->name('payment.capture');
Route::post('/paypal/ipn', [PaymentController::class, 'ipnHandler'])->name('payment.ipn'); 
```


In the controller:

```php
public function ipnHandler(Request $request)
{
    $ipnData = $request->all();
    $verified = $this->payPalService->ipnHandler($ipnData);

    if ($verified) {
        // Process the IPN data and update your order status accordingly
        return response('IPN Handled', 200);
    }

    return response('IPN Verification Failed', 400);
}
```


 
