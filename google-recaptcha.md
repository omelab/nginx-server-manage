## How to use Google reCAPTCHA in Laravel

1. Get reCAPTCHA API Keys:

Go to the Google reCAPTCHA website and sign in.
Register your site to get the API keys: [recaptcha](https://www.google.com/recaptcha/admin/create)
please create recaptcha v2


2. Install Guzzle HTTP Client (if not installed):

```bash
composer require guzzlehttp/guzzle
```

3. Configure Laravel:

Add your reCAPTCHA site key and secret key to your .env file:

```bash
RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
```

4. Create a Form:

Create your contact form in your Laravel view.

5. Integrate reCAPTCHA:

Add reCAPTCHA to your contact form using the provided widget.
Here's an example of how to integrate reCAPTCHA into your form:

```html
<form method="POST" action="/contact">
    @csrf

    <!-- Your other form fields -->

    <div class="g-recaptcha" data-sitekey="{{ env('RECAPTCHA_SITE_KEY') }}"></div>
    <br/>

    <button type="submit">Submit</button>
</form>

<script src="https://www.google.com/recaptcha/api.js" async defer></script>
```

6. Validate reCAPTCHA Response:

In your controller where you handle the contact form submission, validate the reCAPTCHA response.
Use Guzzle to make a POST request to Google's reCAPTCHA validation endpoint.
Here's an example of how to validate reCAPTCHA:

```php
use Illuminate\Http\Request;
use GuzzleHttp\Client;

public function contactSubmit(Request $request)
{
    // Validate reCAPTCHA
    $client = new Client();
    $response = $client->post('https://www.google.com/recaptcha/api/siteverify', [
        'form_params' => [
            'secret'   => env('RECAPTCHA_SECRET_KEY'),
            'response' => $request->input('g-recaptcha-response'),
            'remoteip' => $request->ip()
        ]
    ]);
    $body = json_decode((string) $response->getBody());
    
    if (!$body->success) {
        return redirect()->back()->with('error', 'reCAPTCHA validation failed.');
    }

    // Continue processing form submission
}
```

7. Display reCAPTCHA Errors:

If reCAPTCHA validation fails, display appropriate error messages to the user.
You can handle this in your view or controller.


8. Handle Form Submission:

After successful reCAPTCHA validation, proceed to handle the rest of the form submission as usual.