package com.baentech.gateway_service.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRoutesConfig {

        @Bean
        public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
                return builder.routes()

                                // AUTH SERVICE
                                .route("auth-service", r -> r
                                                .path(
                                                                "/api/auth",
                                                                "/api/auth/**",
                                                                "/oauth2/**",
                                                                "/login/oauth2/**")
                                                .uri("lb://AUTH-SERVICE"))

                                // USER SERVICE
                                .route("user-service", r -> r
                                                .path(
                                                                "/api/users",
                                                                "/api/users/**",
                                                                "/api/addresses",
                                                                "/api/addresses/**")
                                                .uri("lb://USER-SERVICE"))

                                // PRODUCT SERVICE
                                .route("product-service", r -> r
                                                .path(
                                                                "/api/products",
                                                                "/api/products/**",
                                                                "/api/categories",
                                                                "/api/categories/**",
                                                                "/api/reviews",
                                                                "/api/reviews/**",
                                                                "/uploads/products/**")
                                                .uri("lb://PRODUCT-SERVICE"))

                                // CART SERVICE
                                .route("cart-service", r -> r
                                                .path("/api/carts", "/api/carts/**")
                                                .uri("lb://CART-SERVICE"))

                                // ORDER SERVICE
                                .route("order-service", r -> r
                                                .path("/api/orders", "/api/orders/**")
                                                .uri("lb://ORDER-SERVICE"))

                                // PAYMENT SERVICE
                                .route("payment-service", r -> r
                                                .path("/api/payments", "/api/payments/**")
                                                .uri("lb://PAYMENT-SERVICE"))

                                // SHIPPING SERVICE
                                .route("shipping-service", r -> r
                                                .path("/api/shippings", "/api/shippings/**", "/api/shipping", "/api/shipping/**")
                                                .uri("lb://SHIPING-SERIVE"))

                                // REPORT SERVICE
                                .route("report-service", r -> r
                                                .path("/api/reports", "/api/reports/**")
                                                .uri("lb://REPORT-SERVICE"))

                                // NOTIFICATION SERVICE
                                .route("notification-service", r -> r
                                                .path("/api/notifications", "/api/notifications/**")
                                                .uri("lb://NOTIFICATION-SERVICE"))

                                .build();
        }
}
