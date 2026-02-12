# 🌐 Complete API Endpoints Reference

**Base URL:** `http://localhost:8080`

---

## 🔐 Authentication Endpoints

```
POST   http://localhost:8080/api/auth/register
POST   http://localhost:8080/api/auth/login
POST   http://localhost:8080/api/auth/refresh
POST   http://localhost:8080/api/auth/logout
GET    http://localhost:8080/api/auth/me
```

---

## 👥 User Management Endpoints

### Basic CRUD
```
POST   http://localhost:8080/api/users
GET    http://localhost:8080/api/users/{id}
GET    http://localhost:8080/api/users
PUT    http://localhost:8080/api/users/{id}
DELETE http://localhost:8080/api/users/{id}
```

### Enhanced User Endpoints
```
GET    http://localhost:8080/api/users/role/{role}
       Example: http://localhost:8080/api/users/role/STUDENT

GET    http://localhost:8080/api/users/department/{departmentId}
       Example: http://localhost:8080/api/users/department/507f1f77bcf86cd799439011

GET    http://localhost:8080/api/users/email/{email}
       Example: http://localhost:8080/api/users/email/john@example.com

PATCH  http://localhost:8080/api/users/{id}/status
PATCH  http://localhost:8080/api/users/{id}/password
GET    http://localhost:8080/api/users/search?name={name}
       Example: http://localhost:8080/api/users/search?name=John
```

---

## 🏢 Department Endpoints

### Basic CRUD
```
POST   http://localhost:8080/api/departments
GET    http://localhost:8080/api/departments/{id}
GET    http://localhost:8080/api/departments
PUT    http://localhost:8080/api/departments/{id}
DELETE http://localhost:8080/api/departments/{id}
```

### Enhanced Department Endpoints
```
GET    http://localhost:8080/api/departments/code/{code}
       Example: http://localhost:8080/api/departments/code/CS

GET    http://localhost:8080/api/departments/{id}/users
GET    http://localhost:8080/api/departments/{id}/students
GET    http://localhost:8080/api/departments/{id}/teachers
GET    http://localhost:8080/api/departments/{id}/statistics
```

---

## 📅 Attendance Session Endpoints

### Basic CRUD
```
POST   http://localhost:8080/api/sessions
GET    http://localhost:8080/api/sessions/{id}
GET    http://localhost:8080/api/sessions
PUT    http://localhost:8080/api/sessions/{id}
DELETE http://localhost:8080/api/sessions/{id}
```

### Enhanced Session Endpoints ⭐
```
GET    http://localhost:8080/api/sessions/today

GET    http://localhost:8080/api/sessions/department/{departmentId}
       Example: http://localhost:8080/api/sessions/department/507f1f77bcf86cd799439011

GET    http://localhost:8080/api/sessions/teacher/{teacherId}
       Example: http://localhost:8080/api/sessions/teacher/507f1f77bcf86cd799439012

GET    http://localhost:8080/api/sessions/date/{date}
       Example: http://localhost:8080/api/sessions/date/2024-01-15

GET    http://localhost:8080/api/sessions/status/{status}
       Example: http://localhost:8080/api/sessions/status/OPEN

GET    http://localhost:8080/api/sessions/code/{sessionCode}
       Example: http://localhost:8080/api/sessions/code/ABC123XYZ

GET    http://localhost:8080/api/sessions/date-range?from={startDate}&to={endDate}
       Example: http://localhost:8080/api/sessions/date-range?from=2024-01-01&to=2024-01-31

PATCH  http://localhost:8080/api/sessions/{id}/close
POST   http://localhost:8080/api/sessions/{id}/generate-code
```

---

## ✅ Attendance Record Endpoints

### Basic CRUD
```
POST   http://localhost:8080/api/records
GET    http://localhost:8080/api/records/{id}
GET    http://localhost:8080/api/records
PUT    http://localhost:8080/api/records/{id}
DELETE http://localhost:8080/api/records/{id}
```

### Enhanced Record Endpoints ⭐⭐⭐ (Most Important)
```
POST   http://localhost:8080/api/records/mark
       Body: { "sessionCode": "ABC123", "studentId": "...", "status": "PRESENT" }

POST   http://localhost:8080/api/records/bulk
       Body: [{ "sessionId": "...", "studentId": "...", "status": "PRESENT" }, ...]

GET    http://localhost:8080/api/records/session/{sessionId}
       Example: http://localhost:8080/api/records/session/507f1f77bcf86cd799439011

GET    http://localhost:8080/api/records/student/{studentId}
       Example: http://localhost:8080/api/records/student/507f1f77bcf86cd799439012

GET    http://localhost:8080/api/records/student/{studentId}/session/{sessionId}
       Example: http://localhost:8080/api/records/student/507f.../session/507f...

GET    http://localhost:8080/api/records/session/{sessionId}/status/{status}
       Example: http://localhost:8080/api/records/session/507f.../status/PRESENT

GET    http://localhost:8080/api/records/student/{studentId}/percentage
       Example: http://localhost:8080/api/records/student/507f1f77bcf86cd799439012/percentage

GET    http://localhost:8080/api/records/student/{studentId}/date-range?from={}&to={}
       Example: http://localhost:8080/api/records/student/507f.../date-range?from=2024-01-01&to=2024-01-31

GET    http://localhost:8080/api/records/department/{departmentId}/statistics
       Example: http://localhost:8080/api/records/department/507f1f77bcf86cd799439011/statistics

GET    http://localhost:8080/api/records/session/{sessionId}/summary
       Example: http://localhost:8080/api/records/session/507f1f77bcf86cd799439011/summary

PATCH  http://localhost:8080/api/records/{id}/status
       Body: { "status": "LATE" }
```

---

## 🏖️ Leave Management Endpoints

### Basic CRUD
```
POST   http://localhost:8080/api/leaves
GET    http://localhost:8080/api/leaves/{id}
GET    http://localhost:8080/api/leaves
PUT    http://localhost:8080/api/leaves/{id}
DELETE http://localhost:8080/api/leaves/{id}
```

### Enhanced Leave Endpoints
```
GET    http://localhost:8080/api/leaves/user/{userId}
       Example: http://localhost:8080/api/leaves/user/507f1f77bcf86cd799439012

GET    http://localhost:8080/api/leaves/status/{status}
       Example: http://localhost:8080/api/leaves/status/PENDING

GET    http://localhost:8080/api/leaves/pending

GET    http://localhost:8080/api/leaves/date-range?from={startDate}&to={endDate}
       Example: http://localhost:8080/api/leaves/date-range?from=2024-01-01&to=2024-01-31

GET    http://localhost:8080/api/leaves/user/{userId}/upcoming
       Example: http://localhost:8080/api/leaves/user/507f1f77bcf86cd799439012/upcoming

PATCH  http://localhost:8080/api/leaves/{id}/approve
       Body: { "approvedBy": "adminUserId" }

PATCH  http://localhost:8080/api/leaves/{id}/reject
       Body: { "approvedBy": "adminUserId", "reason": "..." }
```

---

## 🔔 Notification Endpoints

### Basic CRUD
```
POST   http://localhost:8080/api/notifications
GET    http://localhost:8080/api/notifications/{id}
GET    http://localhost:8080/api/notifications
PUT    http://localhost:8080/api/notifications/{id}
DELETE http://localhost:8080/api/notifications/{id}
```

### Enhanced Notification Endpoints
```
GET    http://localhost:8080/api/notifications/user/{userId}
       Example: http://localhost:8080/api/notifications/user/507f1f77bcf86cd799439012

GET    http://localhost:8080/api/notifications/user/{userId}/unread
       Example: http://localhost:8080/api/notifications/user/507f1f77bcf86cd799439012/unread

PATCH  http://localhost:8080/api/notifications/{id}/read

PATCH  http://localhost:8080/api/notifications/user/{userId}/read-all
       Example: http://localhost:8080/api/notifications/user/507f1f77bcf86cd799439012/read-all

DELETE http://localhost:8080/api/notifications/user/{userId}/clear
       Example: http://localhost:8080/api/notifications/user/507f1f77bcf86cd799439012/clear
```

---

## 📊 Dashboard Endpoints

```
GET    http://localhost:8080/api/dashboard/admin

GET    http://localhost:8080/api/dashboard/teacher/{teacherId}
       Example: http://localhost:8080/api/dashboard/teacher/507f1f77bcf86cd799439012

GET    http://localhost:8080/api/dashboard/student/{studentId}
       Example: http://localhost:8080/api/dashboard/student/507f1f77bcf86cd799439013
```

---

## 📈 Reports Endpoints

```
GET    http://localhost:8080/api/reports/attendance/student/{studentId}
       Example: http://localhost:8080/api/reports/attendance/student/507f1f77bcf86cd799439013

GET    http://localhost:8080/api/reports/attendance/session/{sessionId}
       Example: http://localhost:8080/api/reports/attendance/session/507f1f77bcf86cd799439011

GET    http://localhost:8080/api/reports/attendance/department/{departmentId}
       Example: http://localhost:8080/api/reports/attendance/department/507f1f77bcf86cd799439010

GET    http://localhost:8080/api/reports/attendance/date-range?from={}&to={}
       Example: http://localhost:8080/api/reports/attendance/date-range?from=2024-01-01&to=2024-01-31

GET    http://localhost:8080/api/reports/defaulters?threshold={percentage}
       Example: http://localhost:8080/api/reports/defaulters?threshold=75

GET    http://localhost:8080/api/reports/export/csv?type={reportType}&id={id}
       Example: http://localhost:8080/api/reports/export/csv?type=student&id=507f...

GET    http://localhost:8080/api/reports/export/pdf?type={reportType}&id={id}
       Example: http://localhost:8080/api/reports/export/pdf?type=session&id=507f...
```

---

## 🎯 Most Critical Endpoints (Implement First)

### 1. Mark Attendance
```
POST http://localhost:8080/api/records/mark
Content-Type: application/json

{
  "sessionCode": "ABC123XYZ",
  "studentId": "507f1f77bcf86cd799439013",
  "status": "PRESENT"
}
```

### 2. Get Today's Sessions
```
GET http://localhost:8080/api/sessions/today
```

### 3. Get Session Attendance
```
GET http://localhost:8080/api/records/session/507f1f77bcf86cd799439011
```

### 4. Get Student Attendance Percentage
```
GET http://localhost:8080/api/records/student/507f1f77bcf86cd799439013/percentage
```

### 5. Approve Leave
```
PATCH http://localhost:8080/api/leaves/507f1f77bcf86cd799439014/approve
Content-Type: application/json

{
  "approvedBy": "507f1f77bcf86cd799439001"
}
```

### 6. Student Dashboard
```
GET http://localhost:8080/api/dashboard/student/507f1f77bcf86cd799439013
```

---

## 📝 Request/Response Examples

### Create User
```bash
POST http://localhost:8080/api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "STUDENT",
  "departmentId": "507f1f77bcf86cd799439010",
  "status": "ACTIVE"
}
```

### Create Attendance Session
```bash
POST http://localhost:8080/api/sessions
Content-Type: application/json

{
  "date": "2024-01-15T10:00:00Z",
  "departmentId": "507f1f77bcf86cd799439010",
  "createdBy": "507f1f77bcf86cd799439012",
  "sessionCode": "ABC123XYZ",
  "status": "OPEN"
}
```

### Mark Attendance
```bash
POST http://localhost:8080/api/records/mark
Content-Type: application/json

{
  "sessionCode": "ABC123XYZ",
  "studentId": "507f1f77bcf86cd799439013",
  "status": "PRESENT"
}
```

### Create Leave Request
```bash
POST http://localhost:8080/api/leaves
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439013",
  "fromDate": "2024-01-20T00:00:00Z",
  "toDate": "2024-01-22T00:00:00Z",
  "reason": "Medical emergency",
  "status": "PENDING"
}
```

---

## 🔍 Query Parameters Reference

### Pagination (Future Enhancement)
```
?page=0&size=10&sort=createdAt,desc
```

### Filtering
```
?status=ACTIVE
?role=STUDENT
?departmentId=507f1f77bcf86cd799439010
```

### Date Range
```
?from=2024-01-01&to=2024-01-31
```

### Search
```
?name=John
?email=john@example.com
?code=CS
```

---

## 📊 Response Status Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 🧪 Testing with cURL

### Get Today's Sessions
```bash
curl -X GET http://localhost:8080/api/sessions/today
```

### Mark Attendance
```bash
curl -X POST http://localhost:8080/api/records/mark \
  -H "Content-Type: application/json" \
  -d '{
    "sessionCode": "ABC123XYZ",
    "studentId": "507f1f77bcf86cd799439013",
    "status": "PRESENT"
  }'
```

### Get Student Percentage
```bash
curl -X GET http://localhost:8080/api/records/student/507f1f77bcf86cd799439013/percentage
```

---

## 🚀 Postman Collection

Import this structure into Postman:
- Create folders for each module (Users, Sessions, Records, Leaves, etc.)
- Add environment variables: `{{baseUrl}}` = `http://localhost:8080`
- Use `{{baseUrl}}/api/users` format

---

**Total Endpoints: 84+**
**Base URL: http://localhost:8080**
**API Version: v1**
