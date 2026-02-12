# MongoDB Setup & Sample Data

## 🚀 Quick Start

### 1. Start MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or using local MongoDB
mongod --dbpath /path/to/data
```

### 2. Connect to MongoDB
```bash
mongosh mongodb://localhost:27017/attendance_system
```

### 3. Verify Collections (After running Spring Boot app)
```javascript
show collections
// Should show: users, departments, attendance_sessions, attendance_records, leaves, notifications
```

---

## 📊 Sample Data Scripts

### Create Departments
```javascript
db.departments.insertMany([
  {
    name: "Computer Science",
    code: "CS",
    createdAt: new Date()
  },
  {
    name: "Information Technology",
    code: "IT",
    createdAt: new Date()
  },
  {
    name: "Electronics",
    code: "EC",
    createdAt: new Date()
  }
])
```

### Create Users
```javascript
// Get department IDs first
const csDept = db.departments.findOne({code: "CS"})._id;

db.users.insertMany([
  {
    name: "Admin User",
    email: "admin@college.edu",
    password: "$2a$10$hashedPasswordHere", // Use BCrypt in production
    role: "ADMIN",
    departmentId: csDept.toString(),
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "John Teacher",
    email: "john.teacher@college.edu",
    password: "$2a$10$hashedPasswordHere",
    role: "TEACHER",
    departmentId: csDept.toString(),
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Alice Student",
    email: "alice.student@college.edu",
    password: "$2a$10$hashedPasswordHere",
    role: "STUDENT",
    departmentId: csDept.toString(),
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

### Create Attendance Session
```javascript
const teacher = db.users.findOne({role: "TEACHER"});
const dept = db.departments.findOne({code: "CS"});

db.attendance_sessions.insertOne({
  date: new Date(),
  departmentId: dept._id.toString(),
  createdBy: teacher._id.toString(),
  sessionCode: "ABC123XYZ",
  status: "OPEN",
  createdAt: new Date()
})
```

### Create Attendance Records
```javascript
const session = db.attendance_sessions.findOne({status: "OPEN"});
const student = db.users.findOne({role: "STUDENT"});

db.attendance_records.insertOne({
  sessionId: session._id.toString(),
  studentId: student._id.toString(),
  status: "PRESENT",
  markedAt: new Date()
})
```

### Create Leave Request
```javascript
const student = db.users.findOne({role: "STUDENT"});

db.leaves.insertOne({
  userId: student._id.toString(),
  fromDate: new Date("2024-01-15"),
  toDate: new Date("2024-01-17"),
  reason: "Medical emergency",
  status: "PENDING",
  approvedBy: null,
  createdAt: new Date()
})
```

### Create Notification
```javascript
const student = db.users.findOne({role: "STUDENT"});

db.notifications.insertOne({
  userId: student._id.toString(),
  message: "Your attendance has been marked for today's session",
  isRead: false,
  createdAt: new Date()
})
```

---

## 🔍 Verify Indexes

```javascript
// Check indexes on users collection
db.users.getIndexes()
// Should show index on email (unique)

// Check indexes on attendance_sessions
db.attendance_sessions.getIndexes()
// Should show index on date

// Check indexes on attendance_records
db.attendance_records.getIndexes()
// Should show compound index on sessionId and studentId
```

---

## 📈 Useful Queries

### Get all students in a department
```javascript
const dept = db.departments.findOne({code: "CS"});
db.users.find({
  role: "STUDENT",
  departmentId: dept._id.toString()
})
```

### Get attendance for a specific session
```javascript
const session = db.attendance_sessions.findOne({sessionCode: "ABC123XYZ"});
db.attendance_records.find({
  sessionId: session._id.toString()
})
```

### Get pending leave requests
```javascript
db.leaves.find({status: "PENDING"})
```

### Get unread notifications for a user
```javascript
const user = db.users.findOne({email: "alice.student@college.edu"});
db.notifications.find({
  userId: user._id.toString(),
  isRead: false
})
```

### Get today's attendance sessions
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

db.attendance_sessions.find({
  date: {
    $gte: today,
    $lt: tomorrow
  }
})
```

---

## 🧹 Cleanup Commands

```javascript
// Drop all collections
db.users.drop()
db.departments.drop()
db.attendance_sessions.drop()
db.attendance_records.drop()
db.leaves.drop()
db.notifications.drop()

// Or drop entire database
use attendance_system
db.dropDatabase()
```

---

## 🔐 Production Considerations

1. **Password Hashing**: Always use BCrypt with proper salt rounds
   ```java
   BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
   String hashedPassword = encoder.encode(rawPassword);
   ```

2. **Index Creation**: Indexes are auto-created by Spring Boot on startup

3. **Connection Pooling**: Configure in application.properties
   ```properties
   spring.data.mongodb.uri=mongodb://localhost:27017/attendance_system?maxPoolSize=50
   ```

4. **Authentication**: Enable MongoDB authentication in production
   ```properties
   spring.data.mongodb.uri=mongodb://username:password@localhost:27017/attendance_system
   ```

---

## 📊 Database Statistics

```javascript
// Get database stats
db.stats()

// Get collection stats
db.users.stats()
db.attendance_records.stats()

// Count documents
db.users.countDocuments()
db.attendance_records.countDocuments()
```

---

**Note:** All indexes will be automatically created when you start the Spring Boot application for the first time.
