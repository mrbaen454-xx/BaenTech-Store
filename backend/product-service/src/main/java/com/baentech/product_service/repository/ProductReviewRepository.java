package com.baentech.product_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.baentech.product_service.entity.ProductReview;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    List<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId);

    Optional<ProductReview> findByProductIdAndEmail(Long productId, String email);

    Long countByProductId(Long productId);

    @Query("SELECT COALESCE(AVG(review.rating), 0) FROM ProductReview review WHERE review.product.id = :productId")
    Double getAverageRatingByProductId(@Param("productId") Long productId);
}
