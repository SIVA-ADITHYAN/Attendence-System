# Twilio SMS Setup Guide

## Step 1: Sign Up for Twilio
1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account
3. Verify your email and phone number
4. You'll get **$15 free credit** (~1000 SMS)

## Step 2: Get Your Credentials

### Account SID and Auth Token:
1. Go to https://console.twilio.com/
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Copy both values

### Get a Phone Number:
1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click "Buy a number"
3. Select a number (free with trial)
4. Copy the phone number (format: +1234567890)

## Step 3: Update application.properties

```properties
# SMS Provider (twilio or fast2sms)
sms.provider=twilio
sms.enabled=true

# Twilio Configuration
twilio.account.sid=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
twilio.auth.token=your_auth_token_here
twilio.phone.number=+1234567890
```

## Step 4: Verify Phone Numbers (Trial Account)

**Important:** Twilio trial accounts can only send SMS to verified phone numbers.

1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click "Add a new number"
3. Enter the parent phone number (e.g., +917695831001)
4. Verify via SMS code
5. Repeat for all parent phone numbers

## Step 5: Test SMS

```json
POST http://localhost:8080/api/attendance
{
  "studentId": "698d6e49017f1b9f2e863517",
  "tutorId": "698d6c8a017f1b9f2e863514",
  "date": "2026-02-12",
  "status": "PRESENT",
  "checkInTime": "17:00:00"
}
```

## Switching Between Providers

### Use Twilio:
```properties
sms.provider=twilio
```

### Use Fast2SMS:
```properties
sms.provider=fast2sms
```

### Disable SMS:
```properties
sms.enabled=false
```

## Pricing (After Free Trial)

- **Twilio:** ~₹0.50-1 per SMS
- **Fast2SMS:** ~₹0.15-0.25 per SMS

## Upgrade to Production

To send SMS to any number (not just verified):
1. Upgrade your Twilio account (add payment method)
2. Complete business verification
3. Remove trial restrictions

## Troubleshooting

**Error: "The number is unverified"**
- Solution: Verify the phone number in Twilio console

**Error: "Authentication failed"**
- Solution: Check Account SID and Auth Token are correct

**Error: "Invalid phone number"**
- Solution: Use international format (+917695831001)
