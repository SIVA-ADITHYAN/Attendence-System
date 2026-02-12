# Attendance Management System - MongoDB Schema & Architecture

## 📋 Overview
Production-ready MongoDB schema design for an Attendance Management System built with Spring Boot, featuring JWT Authentication and Role-Based Access Control.

---

## 🏗️ Architecture

### Package Structure
```
com.backend.attendance/
├── model/
│   ├── enums/
│   │   ├── Role.java
│   │   ├── UserStatus.java
│   │   ├── AttendanceStatus.java
│   │   ├── SessionStatus.java
│   │   └── LeaveStatus.java
│   ├── User.java
│   ├── Department.java
│   ├── AttendanceSession.java
│   ├── AttendanceRecord.java
│   ├── Leave.java
│   └── Notification.java
├── repository/
│   ├── UserRepository.java
│   ├── DepartmentRepository.java
│   ├── AttendanceSessionRepository.java
│   ├── AttendanceRecordRepository.java
│   ├── LeaveRepository.java
│   └── NotificationRepository.java
├── service/
│   ├── UserService.java
│   ├── DepartmentService.java
│   ├── AttendanceSessionService.java
│   ├── AttendanceRecordService.java
│   ├── LeaveService.java
│   └── NotificationService.java
└── controller/
    ├── UserController.java
    ├── DepartmentController.java
    ├── AttendanceSessionController.java
    ├── AttendanceRecordController.java
    ├── LeaveController.java
    └── NotificationController.java
```

---

## 📊 MongoDB Collections

### 1️⃣ Users Collection
**Collection Name:** `users`

**Schema:**
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String (unique)",
  "password": "String (hashed)",
  "role": "ADMIN | TEACHER | STUDENT",
  "departmentId": "String (ObjectId reference)",
  "status": "ACTIVE | INACTIVE",
  "createdAt": "Instant",
  "updatedAt": "Instant"
}
```

**Indexes:**
- Unique index on `email`

**Enums:**
- `Role`: ADMIN, TEACHER, STUDENT
- `UserStatus`: ACTIVE, INACTIVE

---

### 2️⃣ Departments Collection
**Collection Name:** `departments`

**Schema:**
```json
{
  "_id": "ObjectId",
  "name": "String",
  "code": "String",
  "createdAt": "Instant"
}
```

---

### 3️⃣ Attendance Sessions Collection
**Collection Name:** `attendance_sessions`

**Schema:**
```json
{
  "_id": "ObjectId",
  "date": "Instant (indexed)",
  "departmentId": "String (ObjectId reference)",
  "createdBy": "String (teacherId)",
  "sessionCode": "String (random code for attendance)",
  "status": "OPEN | CLOSED",
  "createdAt": "Instant"
}
```

**Indexes:**
- Index on `date`

**Enums:**
- `SessionStatus`: OPEN, CLOSED

---

### 4️⃣ Attendance Records Collection
**Collection Name:** `attendance_records`

**Schema:**
```json
{
  "_id": "ObjectId",
  "sessionId": "String (ObjectId reference)",
  "studentId": "String (ObjectId reference)",
  "status": "PRESENT | ABSENT | LATE | LEAVE",
  "markedAt": "Instant"
}
```

**Indexes:**
- Compound index on `sessionId` and `studentId`

**Enums:**
- `AttendanceStatus`: PRESENT, ABSENT, LATE, LEAVE

---

### 5️⃣ Leaves Collection
**Collection Name:** `leaves`

**Schema:**
```json
{
  "_id": "ObjectId",
  "userId": "String (ObjectId reference)",
  "fromDate": "Instant",
  "toDate": "Instant",
  "reason": "String",
  "status": "PENDING | APPROVED | REJECTED",
  "approvedBy": "String (ObjectId reference)",
  "createdAt": "Instant"
}
```

**Enums:**
- `LeaveStatus`: PENDING, APPROVED, REJECTED

---

### 6️⃣ Notifications Collection
**Collection Name:** `notifications`

**Schema:**
```json
{
  "_id": "ObjectId",
  "userId": "String (ObjectId reference)",
  "message": "String",
  "isRead": "Boolean",
  "createdAt": "Instant"
}
```

---

## 🔑 Key Features

### Clean Architecture Principles
- **Separation of Concerns**: Model, Repository, Service, Controller layers
- **Dependency Injection**: Using Lombok's `@RequiredArgsConstructor`
- **Single Responsibility**: Each class has one clear purpose

### MongoDB Best Practices
- **Indexes**: Strategic indexing for performance
  - Unique index on user email
  - Compound index on attendance records (sessionId + studentId)
  - Index on session date for efficient queries
- **Auto-index Creation**: Enabled in application.properties
- **ObjectId References**: Using String type for flexibility

### Spring Boot Features
- **Lombok Annotations**: `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@RequiredArgsConstructor`
- **MongoDB Annotations**: `@Document`, `@Id`, `@Indexed`, `@CompoundIndex`
- **Repository Pattern**: Extending `MongoRepository`
- **RESTful APIs**: Standard CRUD endpoints

---

## 🚀 API Endpoints

### Users
- `POST /api/users` - Create user
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users` - Get all users
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Departments
- `POST /api/departments` - Create department
- `GET /api/departments/{id}` - Get department by ID
- `GET /api/departments` - Get all departments
- `PUT /api/departments/{id}` - Update department
- `DELETE /api/departments/{id}` - Delete department

### Attendance Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/{id}` - Get session by ID
- `GET /api/sessions` - Get all sessions
- `PUT /api/sessions/{id}` - Update session
- `DELETE /api/sessions/{id}` - Delete session

### Attendance Records
- `POST /api/records` - Create record
- `GET /api/records/{id}` - Get record by ID
- `GET /api/records` - Get all records
- `PUT /api/records/{id}` - Update record
- `DELETE /api/records/{id}` - Delete record

### Leaves
- `POST /api/leaves` - Create leave
- `GET /api/leaves/{id}` - Get leave by ID
- `GET /api/leaves` - Get all leaves
- `PUT /api/leaves/{id}` - Update leave
- `DELETE /api/leaves/{id}` - Delete leave

### Notifications
- `POST /api/notifications` - Create notification
- `GET /api/notifications/{id}` - Get notification by ID
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/{id}` - Update notification
- `DELETE /api/notifications/{id}` - Delete notification

---

## ⚙️ Configuration

### application.properties
```properties
spring.application.name=backend
server.port=8080

# MongoDB Configuration
spring.data.mongodb.uri=mongodb://localhost:27017/attendance_system
spring.data.mongodb.auto-index-creation=true
```

---

## 📦 Dependencies

All required dependencies are already configured in `pom.xml`:
- Spring Boot Starter Data MongoDB
- Spring Boot Starter Web MVC
- Lombok
- Spring Boot DevTools

---

## 🎯 Next Steps

1. **Security Layer**: Implement JWT authentication and authorization
2. **Validation**: Add `@Valid` annotations and custom validators
3. **Exception Handling**: Create global exception handler
4. **DTOs**: Create Data Transfer Objects for API requests/responses
5. **Business Logic**: Enhance services with domain-specific logic
6. **Testing**: Add unit and integration tests

---

## 💡 Usage Example

### Creating a User
```java
User user = new User();
user.setName("John Doe");
user.setEmail("john@example.com");
user.setPassword("hashedPassword");
user.setRole(Role.STUDENT);
user.setDepartmentId("departmentId");
user.setStatus(UserStatus.ACTIVE);
user.setCreatedAt(Instant.now());
user.setUpdatedAt(Instant.now());
```

### Creating an Attendance Session
```java
AttendanceSession session = new AttendanceSession();
session.setDate(Instant.now());
session.setDepartmentId("departmentId");
session.setCreatedBy("teacherId");
session.setSessionCode(UUID.randomUUID().toString());
session.setStatus(SessionStatus.OPEN);
session.setCreatedAt(Instant.now());
```

---

## 📝 Notes

- All timestamps use `java.time.Instant` for UTC consistency
- ObjectId references are stored as `String` for flexibility
- Enums provide type safety and validation
- Indexes are automatically created on application startup
- Services use constructor injection via Lombok's `@RequiredArgsConstructor`

---

**Built with ❤️ using Spring Boot, MongoDB, and Clean Architecture principles**
