package com.baentech.gateway_service.config;



import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRouteConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth-service", route -> route
                        .path("/api/auth/**")
                        .uri("lb://AUTH-SERVICE"))
                .route("product-service", route -> route
                        .path("/api/products/**", "/api/categories/**")
                        .uri("lb://PRODUCT-SERVICE"))
                .route("user-service", route -> route
                        .path("/api/users/**", "/api/addresses/**")
                        .uri("lb://USER-SERVICE"))
                .route("cart-service", route -> route
                        .path("/api/carts/**")
                        .uri("lb://CART-SERVICE"))
                .route("order-service",route -> route
                        .path("/api/orders/**")
                        .uri("lb://ORDER-SERVICE"))
                .route("payment-service", route -> route
                        .path("/api/payments/**")
                        .uri("lb://PAYMENT-SERVICE"))
                .route("shipping-service", route -> route
                        .path("/api/shippings/**")
                        .uri("lb://SHIPPING-SERVICE"))
                .route("notification-service", route -> route
                        .path("/api/notifications/**")
                        .uri("lb://NOTIFICATION-SERVICE"))
                .route("report-service", route -> route
                        .path("/api/reports/**")
                        .uri("lb://REPORT-SERVICE"))
                .build();
    }
}
