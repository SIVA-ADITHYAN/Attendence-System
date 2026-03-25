package com.backend.attendance.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    // Stores email -> {otp, expiry} in memory (no DB needed)
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;
    private final SecureRandom random = new SecureRandom();

    /**
     * Generates a 6-digit OTP, stores it, and returns it.
     */
    public String generateOtp(String email) {
        int code = 100000 + random.nextInt(900000); // always 6 digits
        String otp = String.valueOf(code);
        otpStore.put(email.toLowerCase(), new OtpEntry(otp, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)));
        return otp;
    }

    /**
     * Peeks at the OTP — validates without consuming it.
     * Used for the intermediate "verify OTP" step before setting a new password.
     */
    public boolean peekOtp(String email, String otp) {
        OtpEntry entry = otpStore.get(email.toLowerCase());
        if (entry == null)
            return false;
        if (LocalDateTime.now().isAfter(entry.expiry())) {
            otpStore.remove(email.toLowerCase());
            return false;
        }
        return entry.otp().equals(otp);
    }

    /**
     * Verifies the OTP for the given email and CONSUMES it (removes from store).
     * Used only at the final reset-password step.
     */
    public boolean verifyOtp(String email, String otp) {
        OtpEntry entry = otpStore.get(email.toLowerCase());
        if (entry == null)
            return false;
        if (LocalDateTime.now().isAfter(entry.expiry())) {
            otpStore.remove(email.toLowerCase());
            return false;
        }
        if (!entry.otp().equals(otp))
            return false;
        otpStore.remove(email.toLowerCase()); // consume OTP
        return true;
    }

    private record OtpEntry(String otp, LocalDateTime expiry) {
    }
}
