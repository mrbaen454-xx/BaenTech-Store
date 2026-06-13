package com.baentech.notification_service.service;

import com.baentech.notification_service.payload.req.EmailRequest;
import com.baentech.notification_service.payload.res.MessageResponse;

public interface EmailService {

    MessageResponse sendEmail(EmailRequest request);
    
}