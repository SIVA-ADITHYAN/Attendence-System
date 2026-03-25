package com.backend.attendance.service;

import com.backend.attendance.model.Attendance;
import com.backend.attendance.model.AttendanceStatus;
import com.backend.attendance.model.Student;
import com.backend.attendance.repository.AttendanceRepository;
import com.backend.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final StudentService studentService;
    private final SmsService smsService;
    private final NotificationService notificationService;

    /**
     * Safe create: if a record already exists for (studentId + date), update it instead
     * of creating a duplicate. This prevents duplicate entries when face recognition fires
     * multiple times.
     */
    public synchronized Attendance createAttendance(Attendance attendance) {
        LocalDate date = attendance.getDate() != null ? attendance.getDate() : LocalDate.now();
        attendance.setDate(date);

        Optional<Attendance> existing = attendanceRepository
                .findByStudentIdAndDate(attendance.getStudentId(), date)
                .stream().findFirst();

        if (existing.isPresent()) {
            // Record already exists — update only if the new status is different
            Attendance rec = existing.get();
            boolean wasNotLate = rec.getStatus() != AttendanceStatus.LATE;

            if (attendance.getStatus() != null) {
                rec.setStatus(attendance.getStatus());
            }
            if (attendance.getRemarks() != null) {
                rec.setRemarks(attendance.getRemarks());
            }
            // Do not overwrite checkInTime if already set
            if (rec.getCheckInTime() == null && attendance.getCheckInTime() != null) {
                rec.setCheckInTime(attendance.getCheckInTime());
            }
            
            applyLatenessIfPresent(rec);
            
            Attendance saved = attendanceRepository.save(rec);
            
            if (wasNotLate && saved.getStatus() == AttendanceStatus.LATE) {
                triggerLateNotification(saved);
            }
            
            sendCheckInSms(saved);
            return saved;
        }

        // New record
        applyLatenessIfPresent(attendance);
        Attendance saved = attendanceRepository.save(attendance);
        
        if (saved.getStatus() == AttendanceStatus.LATE) {
            triggerLateNotification(saved);
        }
        
        sendCheckInSms(saved);
        return saved;
    }

    /**
     * Face Recognition Check-in / Check-out Flow:
     *
     * 1. If no record exists → Check-in (mark PRESENT, store check-in time)
     * 2. If already PRESENT or LATE and no checkout yet:
     *    a. Within 3 minutes of check-in → reject with "already checked in" message
     *    b. After 3 minutes → perform Check-out
     *
     * Returns a Map with keys: "action" (CHECKIN / CHECKOUT / ALREADY_PRESENT / COOLING)
     * and "attendance" (the saved record).
     */
    public synchronized Map<String, Object> faceCheckIn(String studentId, String tutorId) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        Optional<Attendance> existingOpt = attendanceRepository
                .findByStudentIdAndDate(studentId, today)
                .stream().findFirst();

        if (existingOpt.isEmpty()) {
            // ── FIRST TIME TODAY → Check-in ──────────────────────────────────
            AttendanceStatus status = AttendanceStatus.PRESENT;
            String remarks = "Biometric Check-in";

            Student student = studentService.getStudentById(studentId).orElse(null);
            
            Attendance newRec = Attendance.builder()
                    .studentId(studentId)
                    .tutorId(tutorId)
                    .date(today)
                    .status(status)
                    .checkInTime(now)
                    .remarks(remarks)
                    .build();
            
            applyLatenessIfPresent(newRec);
            Attendance saved = attendanceRepository.save(newRec);
            
            if (saved.getStatus() == AttendanceStatus.LATE) {
                triggerLateNotification(saved);
            }
            
            sendCheckInSms(saved);
            return Map.of("action", "CHECKIN", "attendance", saved,
                    "message", "Checked in successfully");
        }

        Attendance rec = existingOpt.get();

        // Already checked out → do nothing
        if (rec.getCheckOutTime() != null) {
            return Map.of("action", "COMPLETED", "attendance", rec,
                    "message", "Attendance already completed for today");
        }

        // Check elapsed time since check-in
        if (rec.getCheckInTime() != null) {
            long minutesSinceCheckIn = Duration.between(rec.getCheckInTime(), now).toMinutes();

            if (minutesSinceCheckIn < 3) {
                // Within 3-minute cooling window
                long remaining = 3 - minutesSinceCheckIn;
                return Map.of("action", "COOLING", "attendance", rec,
                        "message", "You are already marked present. Please wait at least " +
                                remaining + " more minute(s) before checking out.");
            }

            // ── After 3 minutes → Check-out ────────────────────────────────
            return Map.of("action", "CHECKOUT", "attendance",
                    performCheckOut(rec), "message", "Checked out successfully");
        }

        // Record exists but no checkInTime (edge case) – treat as already present
        return Map.of("action", "ALREADY_PRESENT", "attendance", rec,
                "message", "You are already marked present.");
    }

    public Optional<Attendance> getAttendanceById(String id) {
        return attendanceRepository.findById(id);
    }

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    public List<Attendance> getAttendanceByStudentId(String studentId) {
        return attendanceRepository.findByStudentId(studentId);
    }

    public List<Attendance> getAttendanceByTutorId(String tutorId) {
        return attendanceRepository.findByTutorId(tutorId);
    }

    public List<Attendance> getAttendanceByDate(LocalDate date) {
        return attendanceRepository.findByDate(date);
    }

    public List<Attendance> getAttendanceByStudentAndDateRange(String studentId, LocalDate startDate,
            LocalDate endDate) {
        return attendanceRepository.findByStudentIdAndDateBetween(studentId, startDate, endDate);
    }

    public List<Attendance> getAttendanceByStatus(AttendanceStatus status) {
        return attendanceRepository.findByStatus(status);
    }

    public List<Attendance> getAttendanceByDateAndCoachingCentre(LocalDate date, String coachingCentreId) {
        List<String> studentIds = studentRepository.findByCoachingCentreId(coachingCentreId)
                .stream().map(Student::getId).collect(Collectors.toList());
        if (studentIds.isEmpty()) {
            return List.of();
        }
        return attendanceRepository.findByDate(date).stream()
                .filter(a -> studentIds.contains(a.getStudentId()))
                .collect(Collectors.toList());
    }

    public Attendance updateAttendance(String id, Attendance attendance) {
        attendance.setId(id);
        
        Optional<Attendance> existing = attendanceRepository.findById(id);
        boolean wasNotLate = existing.isPresent() && existing.get().getStatus() != AttendanceStatus.LATE;
        
        applyLatenessIfPresent(attendance);
        Attendance saved = attendanceRepository.save(attendance);
        
        if (wasNotLate && saved.getStatus() == AttendanceStatus.LATE) {
            triggerLateNotification(saved);
        }
        
        return saved;
    }

    public void deleteAttendance(String id) {
        attendanceRepository.deleteById(id);
    }

    public Attendance checkOut(String attendanceId) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance not found"));
        return performCheckOut(attendance);
    }

    // ── Internal helpers ────────────────────────────────────────────────────────

    private void applyLatenessIfPresent(Attendance attendance) {
        if (attendance.getStatus() == AttendanceStatus.PRESENT && attendance.getCheckInTime() != null) {
            studentService.getStudentById(attendance.getStudentId()).ifPresent(student -> {
                if (student.getBatchStartTime() != null && attendance.getCheckInTime().isAfter(student.getBatchStartTime())) {
                    long minutesLate = Duration.between(student.getBatchStartTime(), attendance.getCheckInTime()).toMinutes();
                    if (minutesLate > 0) {
                        attendance.setStatus(AttendanceStatus.LATE);
                        long hours = minutesLate / 60;
                        long mins = minutesLate % 60;
                        if (hours > 0) {
                            attendance.setRemarks("Late by " + hours + "h " + mins + "m");
                        } else {
                            attendance.setRemarks("Late by " + mins + " min");
                        }
                    }
                }
            });
        }
    }

    private Attendance performCheckOut(Attendance attendance) {
        LocalTime checkOutTime = LocalTime.now();
        attendance.setCheckOutTime(checkOutTime);

        // Calculate total time spent
        if (attendance.getCheckInTime() != null) {
            Duration duration = Duration.between(attendance.getCheckInTime(), checkOutTime);
            long hours = duration.toHours();
            long minutes = duration.toMinutesPart();
            String timeSpent = hours > 0
                    ? hours + "h " + minutes + "m"
                    : minutes + "m";
            attendance.setTotalTimeSpent(timeSpent);
        }

        Attendance updated = attendanceRepository.save(attendance);
        sendCheckOutSms(updated);
        return updated;
    }

    private void sendCheckInSms(Attendance attendance) {
        try {
            Student student = studentService.getStudentById(attendance.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            String time = attendance.getCheckInTime() != null
                    ? attendance.getCheckInTime().format(DateTimeFormatter.ofPattern("hh:mm a"))
                    : "N/A";
            boolean sent = smsService.sendCheckInSms(
                    student.getParentPhone(),
                    student.getStudentName(),
                    attendance.getStatus().toString(),
                    time);
            attendance.setCheckInSmsSent(sent);
            attendanceRepository.save(attendance);
        } catch (Exception e) {
            // Log error but don't fail the attendance creation
        }
    }

    private void sendCheckOutSms(Attendance attendance) {
        try {
            Student student = studentService.getStudentById(attendance.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            String time = attendance.getCheckOutTime() != null
                    ? attendance.getCheckOutTime().format(DateTimeFormatter.ofPattern("hh:mm a"))
                    : "N/A";
            boolean sent = smsService.sendCheckOutSms(
                    student.getParentPhone(),
                    student.getStudentName(),
                    time);
            attendance.setCheckOutSmsSent(sent);
            attendanceRepository.save(attendance);
        } catch (Exception e) {
            // Log error but don't fail the checkout
        }
    }

    private void triggerLateNotification(Attendance attendance) {
        studentService.getStudentById(attendance.getStudentId()).ifPresent(student -> {
            if (student.getTutorId() != null) {
                notificationService.createLateNotification(
                        student.getTutorId(),
                        student.getId(),
                        attendance.getId(),
                        student.getStudentName(),
                        student.getRegisterNumber()
                );
            }
        });
    }
}
