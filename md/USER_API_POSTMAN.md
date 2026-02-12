# User (Tutor) API - Postman JSON Examples

## Create User/Tutor
```
POST http://localhost:8080/api/users
Content-Type: application/json

{
  "fullName": "Rajesh Kumar",
  "email": "rajesh.kumar@example.com",
  "password": "SecurePass123",
  "phoneNumber": "9876543210",
  "role": "USER",
  "isActive": true,
  "isLocked": false,
  "failedAttempts": 0
}
```

## Create Admin User
```
POST http://localhost:8080/api/users
Content-Type: application/json

{
  "fullName": "Admin User",
  "email": "admin@example.com",
  "password": "AdminPass123",
  "phoneNumber": "9876543211",
  "role": "ADMIN",
  "isActive": true,
  "isLocked": false,
  "failedAttempts": 0
}
```

## Get User by ID
```
GET http://localhost:8080/api/users/{userId}
```

## Get All Users
```
GET http://localhost:8080/api/users
```

## Update User
```
PUT http://localhost:8080/api/users/{userId}
Content-Type: application/json

{
  "fullName": "Rajesh Kumar Updated",
  "email": "rajesh.kumar@example.com",
  "password": "NewSecurePass123",
  "phoneNumber": "9876543210",
  "role": "USER",
  "isActive": true,
  "isLocked": false,
  "failedAttempts": 0
}
```

## Delete User
```
DELETE http://localhost:8080/api/users/{userId}
```

## Field Descriptions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| fullName | String | Yes | Full name of the tutor | Rajesh Kumar |
| email | String | Yes | Unique email address | rajesh@example.com |
| password | String | Yes | User password | SecurePass123 |
| phoneNumber | String | Yes | Unique 10-digit phone | 9876543210 |
| role | Enum | Yes | USER or ADMIN | USER |
| isActive | Boolean | No | Account active status | true |
| isLocked | Boolean | No | Account locked status | false |
| failedAttempts | Integer | No | Failed login attempts | 0 |

## Role Values
- `USER` - Regular tutor
- `ADMIN` - Administrator with full access

## Notes
- Email and phone number must be unique
- Password should be strong (consider hashing in production)
- Default values: isActive=true, isLocked=false, failedAttempts=0
- createdAt and updatedAt are auto-generated
