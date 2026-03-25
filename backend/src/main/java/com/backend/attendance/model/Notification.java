package com.backend.attendance.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String tutorId;
    private String studentId;
    private String attendanceId;
    private String studentName;
    private String registerNumber;
    private String message;
    private boolean isRead;
    private LocalDateTime timestamp;
    private String type;
}
