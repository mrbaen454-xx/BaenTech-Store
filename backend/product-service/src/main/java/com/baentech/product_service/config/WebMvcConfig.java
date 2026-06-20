package com.baentech.product_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadPath = Paths.get("uploads/products")
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();

        if (!uploadPath.endsWith("/")) {
            uploadPath = uploadPath + "/";
        }

        registry.addResourceHandler("/api/products/images/**")
                .addResourceLocations(uploadPath);

        // Untuk data lama yang sudah tersimpan sebagai /uploads/products/...
        registry.addResourceHandler("/uploads/products/**")
                .addResourceLocations(uploadPath);
    }
}