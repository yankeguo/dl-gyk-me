# dl-gyk-me

A Cloudflare Worker that proxies and accelerates file downloads from any HTTPS URL.

## Features

- **Download Proxy**: Access any HTTPS URL through the worker to accelerate downloads via Cloudflare's global network
- **Text Replacement**: Perform simple text replacements on the response body using query parameters
- **Security Headers**: Forces file download instead of browser rendering to prevent page spoofing attacks

## Usage

### Basic Download Proxy

```
https://dl.gyk.me/{domain}/{path}
```

**Example:**

```
https://dl.gyk.me/github.com/user/repo/releases/download/v1.0.0/app.zip
```

This will proxy the request to:

```
https://github.com/user/repo/releases/download/v1.0.0/app.zip
```

### Text Replacement

Use the `__sr` (simple replace) query parameter to perform text replacements on the response body.

**Format:**

```
__sr=old_text:new_text
```

**Example:**

```
https://dl.gyk.me/example.com/config.txt?__sr=localhost:production.example.com
```

**Multiple Replacements:**

```
https://dl.gyk.me/example.com/config.txt?__sr=foo:bar&__sr=hello:world
```

> Note: The `__sr` parameter is stripped from the proxied request and will not be sent to the target server.

## Security

The worker applies several security measures:

- **Forced Download**: Sets `Content-Disposition: attachment` to force file download
- **MIME Type Override**: Sets `Content-Type: application/octet-stream` to prevent browser rendering
- **No MIME Sniffing**: Sets `X-Content-Type-Options: nosniff` to prevent MIME type detection
- **Header Sanitization**: Removes Cloudflare-specific headers before forwarding requests

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Deploy to Cloudflare
npm run deploy
```

## License

MIT

## Credits

Yan-Ke Guo, https://gyk.me
