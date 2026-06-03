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
                .build();
    }
}
