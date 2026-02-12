package com.backend.attendance.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    @Value("${sms.provider:twilio}")
    private String smsProvider;

    @Value("${sms.enabled:true}")
    private boolean smsEnabled;

    // Twilio Config
    @Value("${twilio.account.sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth.token:}")
    private String twilioAuthToken;

    @Value("${twilio.phone.number:}")
    private String twilioPhoneNumber;

    // Fast2SMS Config
    @Value("${fast2sms.api.key:}")
    private String fast2smsApiKey;

    @Value("${fast2sms.api.url:}")
    private String fast2smsApiUrl;

    private final RestTemplate restTemplate;

    public boolean sendCheckInSms(String phoneNumber, String studentName, String status, String time) {
        String message = String.format("Dear Parent, %s has checked in at %s. Status: %s", 
                studentName, time, status);
        return sendSms(phoneNumber, message);
    }

    public boolean sendCheckOutSms(String phoneNumber, String studentName, String time) {
        String message = String.format("Dear Parent, %s has checked out at %s", 
                studentName, time);
        return sendSms(phoneNumber, message);
    }

    private boolean sendSms(String phoneNumber, String message) {
        if (!smsEnabled) {
            log.info("SMS disabled. Would have sent to {}: {}", phoneNumber, message);
            return true;
        }

        return "twilio".equalsIgnoreCase(smsProvider) 
                ? sendViaTwilio(phoneNumber, message)
                : sendViaFast2SMS(phoneNumber, message);
    }

    private boolean sendViaTwilio(String phoneNumber, String message) {
        try {
            Twilio.init(twilioAccountSid, twilioAuthToken);
            
            // Add +91 prefix if not present
            String formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : "+91" + phoneNumber;
            
            Message.creator(
                    new PhoneNumber(formattedNumber),
                    new PhoneNumber(twilioPhoneNumber),
                    message
            ).create();
            
            log.info("SMS sent successfully via Twilio to {}", phoneNumber);
            return true;
        } catch (Exception e) {
            log.error("Failed to send SMS via Twilio to {}: {}", phoneNumber, e.getMessage());
            return false;
        }
    }

    private boolean sendViaFast2SMS(String phoneNumber, String message) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("authorization", fast2smsApiKey);

            Map<String, String> body = new HashMap<>();
            body.put("route", "q");
            body.put("message", message);
            body.put("language", "english");
            body.put("flash", "0");
            body.put("numbers", phoneNumber);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(fast2smsApiUrl, request, String.class);
            
            log.info("SMS sent successfully via Fast2SMS to {}", phoneNumber);
            return true;
        } catch (Exception e) {
            log.error("Failed to send SMS via Fast2SMS to {}: {}", phoneNumber, e.getMessage());
            return false;
        }
    }
}
