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
@Document(collection = "students")
public class Student {

    @Id
    private String id;

    private String studentName;
    private String gender;
    private LocalDate dateOfBirth;
    private String schoolName;
    private String standard;

    private String parentName;
    private String parentPhone;
    private String parentAltPhone;

    private String batchName;
    private LocalTime batchStartTime;
    private LocalTime batchEndTime;

    private String tutorId;

    private String coachingCentreId;

    private String address;

    private Boolean isActive = true;
    private LocalDate joinedDate;
    private LocalDate leftDate;

    private String createdBy;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
