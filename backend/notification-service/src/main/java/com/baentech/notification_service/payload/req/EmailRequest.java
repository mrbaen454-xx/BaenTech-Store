package com.baentech.notification_service.payload.req;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmailRequest 
{
    @NotBlank(message = "Email tujuan tidak boleh kosong")
    @Email(message = "Format email tidak valid")
    private String to;

    @NotBlank(message = "Subject email tidak boleh kosong")
    private String subject;

    @NotBlank(message = "isi pesan email tidak boleh kosong")
    private String message;
    
     
}
