package com.backend.attendance.controller;

import com.backend.attendance.dto.RegisterRequest;
import com.backend.attendance.model.CoachingCentre;
import com.backend.attendance.model.Role;
import com.backend.attendance.model.User;
import com.backend.attendance.service.CoachingCentreService;
import com.backend.attendance.service.EmailService;
import com.backend.attendance.service.PasswordResetService;
import com.backend.attendance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final CoachingCentreService coachingCentreService;
    private final EmailService emailService;
    private final PasswordResetService passwordResetService;

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
            admin.setPhoneNumber(request.getPhoneNumber());
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

    /**
     * Step 1: User enters email → send OTP to that email
     * POST /api/auth/forgot-password
     * Body: { "email": "user@example.com" }
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        Optional<User> userOpt = userService.getUserByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            // Security: don't reveal if email exists or not
            return ResponseEntity.ok(Map.of("message", "If this email is registered, you will receive an OTP."));
        }

        try {
            String otp = passwordResetService.generateOtp(email.trim().toLowerCase());
            emailService.sendOtpEmail(email.trim(), otp);
            return ResponseEntity.ok(Map.of("message", "OTP sent to your email address."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send OTP: " + e.getMessage());
        }
    }

    /**
     * Step 2a: Verify OTP only (does NOT consume it)
     * POST /api/auth/verify-otp
     * Body: { "email": "user@example.com", "otp": "123456" }
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");

        if (email == null || otp == null || email.isBlank() || otp.isBlank()) {
            return ResponseEntity.badRequest().body("Email and OTP are required");
        }

        boolean valid = passwordResetService.peekOtp(email.trim().toLowerCase(), otp.trim());
        if (!valid) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired OTP");
        }
        return ResponseEntity.ok(Map.of("message", "OTP verified"));
    }

    /**
     * Step 2b: User submits OTP + new password
     * POST /api/auth/reset-password
     * Body: { "email": "user@example.com", "otp": "123456", "newPassword":
     * "newPass" }
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");

        if (email == null || otp == null || newPassword == null ||
                email.isBlank() || otp.isBlank() || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body("Email, OTP, and new password are required");
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body("Password must be at least 6 characters");
        }

        boolean valid = passwordResetService.verifyOtp(email.trim().toLowerCase(), otp.trim());
        if (!valid) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired OTP");
        }

        Optional<User> userOpt = userService.getUserByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOpt.get();
        user.setPassword(newPassword);
        userService.updateUser(user.getId(), user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
