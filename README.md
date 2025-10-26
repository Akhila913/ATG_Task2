# Email Service (Serverless + Brevo SMTP)

This is a Serverless Framework project that exposes a REST API to send emails via **Brevo SMTP**.  
It uses **Node.js** and **nodemailer**, and can run locally with `serverless-offline`.

---

## Features

- REST API endpoint `/send` (POST)
- Input JSON: `{ receiver_email, subject, body_text }`
- Error handling with proper HTTP response codes
- Supports Brevo SMTP
- Can run locally with Serverless Offline

---

## Prerequisites

- Node.js >= 18
- npm
- Serverless Framework CLI (v4 recommended)
- Brevo account with verified sender email
- SMTP key from Brevo

---

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/email-service.git
cd email-service
```

2. Install dependencies:

```bash
npm install
```

3. Copy .env.example to .env and fill in your Brevo SMTP credentials:

```bash
cp .env.example .env
```

.env should include:

```ini
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-email@example.com
SMTP_PASS=YOUR_BREVO_SMTP_KEY
SMTP_SECURE=false
FROM_EMAIL=your-brevo-email@example.com
```

4. Login to Serverless CLI (if not already):
```bash
npx serverless login
```

## Running Locally

Start the Serverless Offline server:
```bash
npm run start
```

The API will be available at: http://localhost:3000/dev/send

## API Usage

POST /send

## Request Body (JSON):
```json
{
  "receiver_email": "recipient@example.com",
  "subject": "Test Email",
  "body_text": "Hello! This is a test email."
}
```

## Success Response:
```json
{
  "message": "Email sent",
  "accepted": ["recipient@example.com"],
  "rejected": [],
  "messageId": "<id>"
}
```

## Error Responses:

- 400 for invalid request or missing fields

- 500 for server errors
