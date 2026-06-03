package com.baentech.product_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baentech.product_service.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    boolean existsByNameIgnoreCase(String name);
}
