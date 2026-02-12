# Student Bulk Upload Guide

## Excel Template Format

Create an Excel file (.xlsx) with the following columns in order:

| Column | Field Name | Type | Example |
|--------|------------|------|---------|
| A | Student Name | Text | Arun Kumar |
| B | Gender | Text | Male |
| C | Date of Birth | Date | 2010-06-15 |
| D | School Name | Text | ABC Matric School |
| E | Standard | Text | 10th |
| F | Parent Name | Text | Ramesh |
| G | Parent Phone | Text | 9876543211 |
| H | Parent Alt Phone | Text | 9876543212 |
| I | Batch Name | Text | Evening Batch |
| J | Batch Start Time | Time | 17:00:00 |
| K | Batch End Time | Time | 19:00:00 |
| L | Tutor ID | Text | tutor123 |
| M | Address | Text | Chennai |
| N | Joined Date | Date | 2025-06-01 |

## API Endpoints

### Single Student Creation
```
POST /api/students
Content-Type: application/json

Body: {
  "studentName": "Arun Kumar",
  "gender": "Male",
  "dateOfBirth": "2010-06-15",
  "schoolName": "ABC Matric School",
  "standard": "10th",
  "parentName": "Ramesh",
  "parentPhone": "9876543211",
  "parentAltPhone": "9876543212",
  "batchName": "Evening Batch",
  "batchStartTime": "17:00:00",
  "batchEndTime": "19:00:00",
  "tutorId": "tutor123",
  "address": "Chennai",
  "joinedDate": "2025-06-01"
}
```

### Bulk Student Upload (Excel)
```
POST /api/students/upload
Content-Type: multipart/form-data

Form Data:
  file: [Excel file]
```

## Notes
- First row should be headers
- Data starts from row 2
- Date format: YYYY-MM-DD
- Time format: HH:mm:ss or Excel time format
- Phone numbers should be 10 digits
