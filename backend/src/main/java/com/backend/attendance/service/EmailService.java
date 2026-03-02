package com.backend.attendance.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username}")
  private String fromEmail;

  public void sendOtpEmail(String toEmail, String otp) throws MessagingException {
    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom(fromEmail);
    helper.setTo(toEmail);
    helper.setSubject("Password Reset OTP - Smart Attendance");

    String htmlContent = """
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto;
                    background: #ffffff; border-radius: 16px; overflow: hidden;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #4f46e5 0%%, #7c3aed 100%%);
                      padding: 36px 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;
                       letter-spacing: -0.5px;">Smart Attendance</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">
              Password Reset Request
            </p>
          </div>
          <div style="padding: 40px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
              We received a request to reset your password. Use the OTP below to continue:
            </p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 24px;
                        text-align: center; margin: 0 0 24px;">
              <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px;
                           color: #4f46e5; font-family: monospace;">%s</span>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">
              This OTP is valid for <strong>10 minutes</strong>.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              If you did not request a password reset, please ignore this email.
            </p>
          </div>
          <div style="background: #f9fafb; padding: 20px 40px; text-align: center;
                      border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              2025 Smart Attendance. All rights reserved.
            </p>
          </div>
        </div>
        """.formatted(otp);

    helper.setText(htmlContent, true);
    mailSender.send(message);
  }
}
