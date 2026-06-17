package com.baentech.product_service.service;

import java.util.List;

import com.baentech.product_service.payload.req.ProductReviewRequest;
import com.baentech.product_service.payload.res.MessageResponse;
import com.baentech.product_service.payload.res.ProductReviewResponse;
import com.baentech.product_service.payload.res.ProductReviewSummaryResponse;

public interface ProductReviewService {

    List<ProductReviewResponse> getReviewsByProduct(Long productId);

    ProductReviewSummaryResponse getReviewSummary(Long productId);

    ProductReviewResponse createOrUpdateReview(Long productId, ProductReviewRequest request, String email);

    MessageResponse deleteReview(Long reviewId, String email, boolean admin);
}
