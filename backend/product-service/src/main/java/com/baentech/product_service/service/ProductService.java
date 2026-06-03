package com.baentech.product_service.service;

import com.baentech.product_service.payload.req.ProductRequest;
import com.baentech.product_service.payload.res.MessageResponse;
import com.baentech.product_service.payload.res.ProductResponse;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request);

    List<ProductResponse> getAllProducts();

    ProductResponse getProductById(Long id);

    ProductResponse updateProduct(Long id, ProductRequest request);

    MessageResponse deleteProduct(Long id);

    List<ProductResponse> searchProducts(String keyword);

    List<ProductResponse> getProductsByCategory(Long categoryId);

    List<ProductResponse> getProductsByBrand(String brand);
    
    ProductResponse uploadProductImage(Long productId, MultipartFile file);
}