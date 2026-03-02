package com.backend.attendance.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String accountEmail;
    private String password;
    private String confirmPassword; // Added to match frontend, even if unused by backend specifically

    private String centreName;
    private String ownerName;
    private String contactEmail;
    private String phoneNumber;
    private String address;
}
