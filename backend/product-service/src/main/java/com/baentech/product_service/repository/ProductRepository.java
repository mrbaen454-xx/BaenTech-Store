package com.baentech.product_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baentech.product_service.entity.Product;
import com.baentech.product_service.entity.ProductStatus;

public interface ProductRepository extends JpaRepository<Product, Long> {
    
    List<Product> findByNameContainingIgnoreCase(String keyword);
    List<Product> findByBrandIgnoreCase(String brand);
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByStatus(ProductStatus status);
}
