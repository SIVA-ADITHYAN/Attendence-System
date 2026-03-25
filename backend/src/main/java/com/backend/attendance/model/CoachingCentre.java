package com.backend.attendance.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "coaching_centres")
public class CoachingCentre {

    @Id
    private String id;

    private String centreName;
    private String ownerName;
    private String adminId;

    @Indexed(unique = true)
    private String email;

    @Indexed(unique = true)
    private String phone;

    private String address;

    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    private LocalDateTime createdAt;
}
