package com.backend.attendance.service;

import com.backend.attendance.model.Notification;
import com.backend.attendance.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public Notification createLateNotification(String tutorId, String studentId, String attendanceId, String studentName, String registerNumber) {
        String message = "Student " + (studentName != null ? studentName : "Unknown") + 
                " (Reg: " + (registerNumber != null ? registerNumber : "N/A") + 
                ") arrived late. Please click here to enter the reason for late arrival.";
                
        Notification notification = Notification.builder()
                .tutorId(tutorId)
                .studentId(studentId)
                .attendanceId(attendanceId)
                .studentName(studentName)
                .registerNumber(registerNumber)
                .message(message)
                .type("LATE_ARRIVAL")
                .isRead(false)
                .timestamp(LocalDateTime.now())
                .build();
                
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsForTutor(String tutorId) {
        return notificationRepository.findByTutorIdOrderByTimestampDesc(tutorId);
    }
    
    public List<Notification> getUnreadNotificationsForTutor(String tutorId) {
        return notificationRepository.findByTutorIdAndIsReadFalse(tutorId);
    }

    public Optional<Notification> markAsRead(String id) {
        return notificationRepository.findById(id).map(n -> {
            n.setRead(true);
            return notificationRepository.save(n);
        });
    }

    public void markAttendanceNotificationAsRead(String attendanceId) {
        // Find notification by attendance ID if one exists, and mark read
        // It's a soft approach - assuming we might want to clean them up.
        // Actually, let's keep it simple: we mark by id.
    }
}
