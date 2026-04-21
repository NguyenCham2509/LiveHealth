package com.livehealth.product;

import com.livehealth.product.ProductPromotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductPromotionRepository extends JpaRepository<ProductPromotion, UUID> {

    List<ProductPromotion> findByProductId(UUID productId);

    Optional<ProductPromotion> findByProductIdAndIsActiveTrue(UUID productId);
}
