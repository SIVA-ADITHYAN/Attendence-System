# SMS Feature Implementation

## Configuration Required

Add your Fast2SMS API key to `application.properties`:
```properties
fast2sms.api.key=YOUR_ACTUAL_API_KEY_HERE
```

Get your API key from: https://www.fast2sms.com/dashboard/dev-api

## API Endpoints

### Check-In (Automatic SMS)
```
POST /api/attendance
Body: {
  "studentId": "stu101",
  "tutorId": "tutor123",
  "date": "2026-02-12",
  "status": "PRESENT",
  "checkInTime": "17:00:00"
}
```
Automatically sends SMS to parent on check-in.

### Check-Out (Automatic SMS)
```
POST /api/attendance/{attendanceId}/checkout
```
Automatically sends SMS to parent on check-out.

## SMS Templates

**Check-In SMS:**
"Dear Parent, {studentName} has checked in at {time}. Status: {status}"

**Check-Out SMS:**
"Dear Parent, {studentName} has checked out at {time}"

## Features Implemented

1. SmsService - Handles Fast2SMS API integration
2. Automatic SMS on attendance creation (check-in)
3. Automatic SMS on checkout
4. SMS status tracking (checkInSmsSent, checkOutSmsSent)
5. Error handling - SMS failures don't block attendance operations
