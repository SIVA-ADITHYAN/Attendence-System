package com.backend.attendance.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    public void sendOtpEmail(String to, String otp) {
        String subject = "Your Password Reset OTP";
        String body = "Hello,\n\n" +
                "Your OTP for password reset is: " + otp + "\n" +
                "This OTP is valid for 10 minutes.\n\n" +
                "If you did not request a password reset, please ignore this email.";
        sendEmail(to, subject, body);
    }
}
