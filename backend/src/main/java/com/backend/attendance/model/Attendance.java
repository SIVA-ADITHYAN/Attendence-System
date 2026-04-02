package com.backend.attendance.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "attendance")
public class Attendance {

    @Id
    private String id;

    private String studentId;
    private String tutorId;

    private LocalDate date;
    private AttendanceStatus status;

    private LocalTime checkInTime;
    private LocalTime checkOutTime;

    private String remarks;

    private String totalTimeSpent; // e.g. "2h 30m" – calculated on checkout

    @Builder.Default
    private Boolean checkInSmsSent = false;
    @Builder.Default
    private Boolean checkOutSmsSent = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
