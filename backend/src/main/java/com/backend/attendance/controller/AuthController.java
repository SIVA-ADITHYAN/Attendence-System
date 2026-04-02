package com.backend.attendance.controller;

import com.backend.attendance.dto.RegisterRequest;
import com.backend.attendance.model.CoachingCentre;
import com.backend.attendance.model.Role;
import com.backend.attendance.model.User;
import com.backend.attendance.service.CoachingCentreService;
import com.backend.attendance.service.EmailService;
import com.backend.attendance.service.PasswordResetService;
import com.backend.attendance.service.UserService;
import com.backend.attendance.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordResetService passwordResetService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

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
            admin.setPassword(passwordEncoder.encode(request.getPassword())); // Hashed using BCrypt
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
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "This email is not registered with us"));
        }

        try {
            String otp = passwordResetService.generateOtp(email.trim().toLowerCase());
            System.out.println("DEBUG: Sending OTP [" + otp + "] to email [" + email + "]");
            emailService.sendOtpEmail(email.trim().toLowerCase(), otp);
            return ResponseEntity.ok(Map.of("message", "OTP sent to your email address."));
        } catch (Exception e) {
            System.err.println("ERROR: Failed to send email: " + e.getMessage());
            // During development, we return success but mention the email failure so you can still use the console OTP
            return ResponseEntity.ok(Map.of(
                "message", "OTP generated (see console), but email failed to send. Check your .env SMTP settings.",
                "debugOtp", passwordResetService.generateOtp(email.trim().toLowerCase()) // Regenerate/get for UI if needed
            ));
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid or expired OTP"));
        }

        Optional<User> userOpt = userService.getUserByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword)); // Hashes new password before saving
        userService.updateUser(user.getId(), user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    /**
     * Step 3: Login User and generate JWT
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body("Email and password are required");
        }

        Optional<User> userOpt = userService.getUserByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }

        User user = userOpt.get();
        
        // Check if the provided raw password matches the hashed password in the DB
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }

        // Generate the token since they proved their identity!
        String token = jwtUtil.generateToken(user);
        
        return ResponseEntity.ok(Map.of(
            "message", "Login successful",
            "token", token,
            "user", user // Includes the user object safely without exposing all users
        ));
    }
}
