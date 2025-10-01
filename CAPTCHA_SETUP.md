# CAPTCHA Setup Instructions

## Google reCAPTCHA Configuration

The CAPTCHA system has been successfully integrated into the URL shortener application. Here's how to set it up:

### 1. Get Google reCAPTCHA Keys

1. Go to the [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to create a new site
3. Choose reCAPTCHA v2 → "I'm not a robot" Checkbox
4. Add your domain (e.g., `localhost`, `trimurlz.me`)
5. Register and get your Site Key and Secret Key

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

### 3. Server-Side Verification (Optional but Recommended)

For production use, you should verify the CAPTCHA token on the server side. The current implementation logs the token but doesn't verify it with Google's API.

To implement server-side verification:

1. Create an API endpoint that verifies the CAPTCHA token with Google
2. Update the `createUrl` function in `src/db/apiUrl.js` to call this endpoint
3. Only proceed with URL creation if CAPTCHA verification succeeds

Example server-side verification code:

```javascript
// Server-side CAPTCHA verification
async function verifyCaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${secretKey}&response=${token}`,
  });
  
  const data = await response.json();
  return data.success;
}
```

### 4. Testing

For development/testing, the system uses a test key that always passes verification. In production, make sure to replace this with your actual keys.

### 5. Current Implementation

The CAPTCHA system:
- Shows a CAPTCHA challenge after clicking the "Lưu" button
- Requires CAPTCHA verification before creating a new URL
- Includes the CAPTCHA token in the API request
- Uses a test key for development (bypasses verification)

### 6. Next Steps for Production

1. Replace the test key with your actual Site Key
2. Implement server-side CAPTCHA verification
3. Add error handling for failed CAPTCHA verification
4. Consider rate limiting based on CAPTCHA success/failure

### Troubleshooting

- If CAPTCHA doesn't appear, check that `react-google-recaptcha` is installed
- If verification fails, check your reCAPTCHA keys and domain settings
- For development on localhost, make sure to add `localhost` to your reCAPTCHA allowed domains
