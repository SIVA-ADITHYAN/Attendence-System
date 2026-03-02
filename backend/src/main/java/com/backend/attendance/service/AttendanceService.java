package com.backend.attendance.service;

import com.backend.attendance.model.Attendance;
import com.backend.attendance.model.AttendanceStatus;
import com.backend.attendance.model.Student;
import com.backend.attendance.repository.AttendanceRepository;
import com.backend.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final StudentService studentService;
    private final SmsService smsService;

    public Attendance createAttendance(Attendance attendance) {
        Attendance saved = attendanceRepository.save(attendance);
        sendCheckInSms(saved);
        return saved;
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
        return attendanceRepository.findByDateAndStudentIdIn(date, studentIds);
    }

    public Attendance updateAttendance(String id, Attendance attendance) {
        attendance.setId(id);
        return attendanceRepository.save(attendance);
    }

    public void deleteAttendance(String id) {
        attendanceRepository.deleteById(id);
    }

    public Attendance checkOut(String attendanceId) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance not found"));

        attendance.setCheckOutTime(java.time.LocalTime.now());
        Attendance updated = attendanceRepository.save(attendance);
        sendCheckOutSms(updated);
        return updated;
    }

    private void sendCheckInSms(Attendance attendance) {
        try {
            Student student = studentService.getStudentById(attendance.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            String time = attendance.getCheckInTime().format(DateTimeFormatter.ofPattern("hh:mm a"));
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

            String time = attendance.getCheckOutTime().format(DateTimeFormatter.ofPattern("hh:mm a"));
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
}
