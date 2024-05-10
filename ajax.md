## Ajax form validation

```js

makeAjaxPost(data, url)
    .then(function(resp) { 
        if (resp.status == "Success") {
            if (service_type == 'Warranty Product') {
                swalRedirect(warrantyRoute, 'Thanks, your request warranty claim successfully done!', 'success');
            } else {
                swalRedirect(serviceRoute, 'Thanks, your request service entry successfully done!', 'success');
            }
        } else {
            swalError('Sorry, unable to send this service entry');
        }
    })
    .catch((e) => {
        const response = JSON.parse(e.responseText);
        if (response.errors) {
            let errorMessage = "Validation Error: ";
            for (const key in response.errors) {
                errorMessage += response.errors[key][0] + "\n";
            }
            swalError(errorMessage);
        } else if (response.message && response.message != '') {
            swalError(response.message);
        }
    });
```