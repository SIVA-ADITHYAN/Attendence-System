package com.backend.attendance.controller;

import com.backend.attendance.model.Notification;
import com.backend.attendance.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<Notification>> getTutorNotifications(@PathVariable String tutorId) {
        return ResponseEntity.ok(notificationService.getNotificationsForTutor(tutorId));
    }

    @GetMapping("/tutor/{tutorId}/unread")
    public ResponseEntity<List<Notification>> getUnreadTutorNotifications(@PathVariable String tutorId) {
        return ResponseEntity.ok(notificationService.getUnreadNotificationsForTutor(tutorId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id) {
        return notificationService.markAsRead(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
