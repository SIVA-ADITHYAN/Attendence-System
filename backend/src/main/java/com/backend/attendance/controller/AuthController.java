package com.backend.attendance.controller;

import com.backend.attendance.dto.RegisterRequest;
import com.backend.attendance.model.CoachingCentre;
import com.backend.attendance.model.Role;
import com.backend.attendance.model.User;
import com.backend.attendance.service.CoachingCentreService;
import com.backend.attendance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final CoachingCentreService coachingCentreService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userService.existsByEmail(request.getAccountEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is already registered");
        }

        try {
            // 1. Create User (ADMIN)
            User admin = new User();
            admin.setFullName(request.getFullName());
            admin.setEmail(request.getAccountEmail());
            admin.setPassword(request.getPassword()); // Consider hashing this password
            admin.setPhoneNumber(request.getPhoneNumber()); // Assuming the phone number in step 2 can be admin's too
            admin.setRole(Role.ADMIN);
            admin.setCreatedAt(LocalDateTime.now());

            User savedAdmin = userService.createUser(admin);

            // 2. Create Coaching Centre
            CoachingCentre centre = new CoachingCentre();
            centre.setCentreName(request.getCentreName());
            centre.setOwnerName(request.getOwnerName());
            centre.setEmail(request.getContactEmail());
            centre.setPhone(request.getPhoneNumber());
            centre.setAddress(request.getAddress());
            centre.setAdminId(savedAdmin.getId());
            centre.setIsActive(true);
            centre.setCreatedAt(LocalDateTime.now());

            CoachingCentre savedCentre = coachingCentreService.createCoachingCentre(centre);

            // 3. Link Admin to Coaching Centre
            savedAdmin.setCoachingCentreId(savedCentre.getId());
            userService.updateUser(savedAdmin.getId(), savedAdmin);

            return ResponseEntity.status(HttpStatus.CREATED).body(savedAdmin);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to register: " + e.getMessage());
        }
    }
}
