package com.baentech.gateway_service.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Component
public class DedupeCorsHeaderFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            HttpHeaders headers = exchange.getResponse().getHeaders();

            dedupeHeader(headers, HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
            dedupeHeader(headers, HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS);
            dedupeHeader(headers, HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS);
            dedupeHeader(headers, HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS);
        }));
    }

    private void dedupeHeader(HttpHeaders headers, String headerName) {
        List<String> values = headers.get(headerName);

        if (values == null || values.isEmpty()) {
            return;
        }

        List<String> splitValues = new ArrayList<>();

        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }

            String[] parts = value.split(",");
            for (String part : parts) {
                String cleaned = part.trim();
                if (!cleaned.isEmpty()) {
                    splitValues.add(cleaned);
                }
            }
        }

        if (splitValues.isEmpty()) {
            headers.remove(headerName);
            return;
        }

        List<String> uniqueValues = new ArrayList<>(new LinkedHashSet<>(splitValues));
        headers.set(headerName, uniqueValues.get(0));
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
