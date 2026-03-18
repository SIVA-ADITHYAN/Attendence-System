package com.backend.attendance.controller;

import com.backend.attendance.model.Attendance;
import com.backend.attendance.model.AttendanceStatus;
import com.backend.attendance.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping
    public ResponseEntity<Attendance> createAttendance(@RequestBody Attendance attendance) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.createAttendance(attendance));
    }

    /**
     * Face Recognition Check-in / Check-out endpoint.
     * Handles:
     *   - First scan: check-in (mark Present + store check-in time)
     *   - Re-scan within 3 minutes: returns COOLING message
     *   - Re-scan after 3 minutes: check-out + calculates totalTimeSpent
     *
     * Request body: { "studentId": "...", "tutorId": "..." }
     * Response:     { "action": "CHECKIN|CHECKOUT|COOLING|ALREADY_PRESENT|COMPLETED",
     *                 "message": "...", "attendance": { ... } }
     */
    @PostMapping("/face-checkin")
    public ResponseEntity<Map<String, Object>> faceCheckIn(@RequestBody Map<String, String> body) {
        String studentId = body.get("studentId");
        String tutorId = body.get("tutorId");
        if (studentId == null || studentId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "studentId is required"));
        }
        Map<String, Object> result = attendanceService.faceCheckIn(studentId, tutorId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Attendance> getAttendanceById(@PathVariable String id) {
        return attendanceService.getAttendanceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Attendance>> getAllAttendance() {
        return ResponseEntity.ok(attendanceService.getAllAttendance());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Attendance>> getAttendanceByStudentId(@PathVariable String studentId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByStudentId(studentId));
    }

    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<Attendance>> getAttendanceByTutorId(@PathVariable String tutorId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByTutorId(tutorId));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<Attendance>> getAttendanceByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getAttendanceByDate(date));
    }

    @GetMapping("/coaching-centre/{coachingCentreId}/date/{date}")
    public ResponseEntity<List<Attendance>> getAttendanceByCoachingCentreAndDate(
            @PathVariable String coachingCentreId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getAttendanceByDateAndCoachingCentre(date, coachingCentreId));
    }

    @GetMapping("/student/{studentId}/range")
    public ResponseEntity<List<Attendance>> getAttendanceByStudentAndDateRange(
            @PathVariable String studentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(attendanceService.getAttendanceByStudentAndDateRange(studentId, startDate, endDate));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Attendance>> getAttendanceByStatus(@PathVariable AttendanceStatus status) {
        return ResponseEntity.ok(attendanceService.getAttendanceByStatus(status));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Attendance> updateAttendance(@PathVariable String id, @RequestBody Attendance attendance) {
        return ResponseEntity.ok(attendanceService.updateAttendance(id, attendance));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable String id) {
        attendanceService.deleteAttendance(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<Attendance> checkOut(@PathVariable String id) {
        return ResponseEntity.ok(attendanceService.checkOut(id));
    }
}
