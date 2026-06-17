package com.baentech.product_service.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baentech.product_service.entity.Product;
import com.baentech.product_service.entity.ProductReview;
import com.baentech.product_service.payload.req.ProductReviewRequest;
import com.baentech.product_service.payload.res.MessageResponse;
import com.baentech.product_service.payload.res.ProductReviewResponse;
import com.baentech.product_service.payload.res.ProductReviewSummaryResponse;
import com.baentech.product_service.repository.ProductRepository;
import com.baentech.product_service.repository.ProductReviewRepository;
import com.baentech.product_service.service.ProductReviewService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductReviewServiceImpl implements ProductReviewService {

    private final ProductRepository productRepository;
    private final ProductReviewRepository productReviewRepository;

    @Override
    public List<ProductReviewResponse> getReviewsByProduct(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new RuntimeException("Produk tidak ditemukan");
        }

        return productReviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ProductReviewSummaryResponse getReviewSummary(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new RuntimeException("Produk tidak ditemukan");
        }

        Double averageRating = productReviewRepository.getAverageRatingByProductId(productId);
        Long totalReviews = productReviewRepository.countByProductId(productId);

        return ProductReviewSummaryResponse.builder()
                .productId(productId)
                .averageRating(averageRating == null ? 0.0 : averageRating)
                .totalReviews(totalReviews == null ? 0L : totalReviews)
                .build();
    }

    @Override
    @Transactional
    public ProductReviewResponse createOrUpdateReview(Long productId, ProductReviewRequest request, String email) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan"));

        String cleanEmail = normalizeEmail(email);
        String userName = request.getUserName();

        if (userName == null || userName.isBlank()) {
            userName = cleanEmail;
        }

        ProductReview review = productReviewRepository.findByProductIdAndEmail(productId, cleanEmail)
                .orElse(ProductReview.builder()
                        .product(product)
                        .email(cleanEmail)
                        .build());

        review.setUserName(userName.trim());
        review.setRating(request.getRating());
        review.setComment(request.getComment().trim());

        ProductReview savedReview = productReviewRepository.save(review);

        return mapToResponse(savedReview);
    }

    @Override
    @Transactional
    public MessageResponse deleteReview(Long reviewId, String email, boolean admin) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Ulasan tidak ditemukan"));

        String cleanEmail = normalizeEmail(email);

        if (!admin && !review.getEmail().equalsIgnoreCase(cleanEmail)) {
            throw new RuntimeException("Anda tidak memiliki akses untuk menghapus ulasan ini");
        }

        productReviewRepository.delete(review);

        return MessageResponse.builder()
                .success(true)
                .message("Ulasan berhasil dihapus")
                .build();
    }

    private ProductReviewResponse mapToResponse(ProductReview review) {
        return ProductReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .email(review.getEmail())
                .userName(review.getUserName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email user tidak ditemukan dari token");
        }

        return email.trim().toLowerCase();
    }
}
