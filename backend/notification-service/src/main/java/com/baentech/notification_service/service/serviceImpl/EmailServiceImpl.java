package com.baentech.notification_service.service.serviceImpl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.baentech.notification_service.payload.req.EmailRequest;
import com.baentech.notification_service.payload.res.MessageResponse;
import com.baentech.notification_service.service.EmailService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService
{
    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public MessageResponse sendEmail(EmailRequest request) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setFrom(fromEmail);
            message.setTo(request.getTo());
            message.setSubject(request.getSubject());
            message.setText(request.getMessage());

            javaMailSender.send(message);

            return MessageResponse.builder()
                .message("Email berhasil dikirim " + request.getTo())
                .success(true)
                .build();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengirim email : " + e.getMessage());
        }
    }


}