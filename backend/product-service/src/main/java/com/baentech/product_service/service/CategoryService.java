package com.baentech.product_service.service;

import com.baentech.product_service.payload.req.CategoryRequest;
import com.baentech.product_service.payload.res.CategoryResponse;
import com.baentech.product_service.payload.res.MessageResponse;

import java.util.List;

public interface CategoryService {

    CategoryResponse createCategory(CategoryRequest request);

    List<CategoryResponse> getAllCategories();

    CategoryResponse getCategoryById(Long id);

    CategoryResponse updateCategory(Long id, CategoryRequest request);

    MessageResponse deleteCategory(Long id);
}