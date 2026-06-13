package com.baentech.cart_service.service.serviceImpl;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.baentech.cart_service.entity.Cart;
import com.baentech.cart_service.entity.CartItem;
import com.baentech.cart_service.payload.client.ProductClientResponse;
import com.baentech.cart_service.payload.req.AddCartItemRequest;
import com.baentech.cart_service.payload.req.UpdateCartItemRequest;
import com.baentech.cart_service.payload.res.CartItemResponse;
import com.baentech.cart_service.payload.res.CartResponse;
import com.baentech.cart_service.payload.res.MessageResponse;
import com.baentech.cart_service.repository.CartItemRepository;
import com.baentech.cart_service.repository.CartRepository;
import com.baentech.cart_service.service.CartService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService{

    private final CartRepository cartRepository;

    private final CartItemRepository cartItemRepository;

    private final WebClient.Builder webClientBuilder;

    @Override
    public CartResponse addItemToCart(String email, AddCartItemRequest request)
    {
      try {
        Cart cart = getOrCreateCart(email);

        ProductClientResponse product = getProductFromProductClientResponse(request.getProductId());

        if (product == null) {
            throw new RuntimeException("Produk tidak ditemukan");
        }

        if (!"ACTIVE".equalsIgnoreCase(product.getStatus())) {
            throw new RuntimeException("Produk tidak aktif");
        }

        int requestQuantity = request.getQuantity() != null ? request.getQuantity() : 1;
        int stock = product.getStock() != null ? product.getStock() : 0;

        if (stock <= 0 ) {
            throw new RuntimeException("Stok produk habis");
        }

        if (stock < requestQuantity) {
            throw new RuntimeException("Quentity melebihi stok produk");
        }

        CartItem cartItem = cartItemRepository
            .findByCartEmailAndProductId(email, request.getProductId())
            .orElse(null);
        
        BigDecimal price = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;

        if (cartItem != null) {
            int currentQuantity = cartItem.getQuantity() != null ? cartItem.getQuantity() : 0;
            int newQuantity = currentQuantity + requestQuantity;

            if (newQuantity > stock) {
                throw new RuntimeException("Total quantity di cart melibihi stok produk");
            }

            cartItem.setQuantity(newQuantity);
            cartItem.setPrice(price);
            cartItem.setProductName(product.getName());
            cartItem.setProductBrand(product.getBrand());
            cartItem.setProductImageUrl(product.getImageUrl());
            cartItem.setSubTotal(price.multiply(BigDecimal.valueOf(newQuantity)));

            cartItemRepository.save(cartItem);
        }else{
            CartItem newItem = CartItem.builder()
                  .cart(cart)
                  .productId(product.getId())
                  .productName(product.getName())
                  .productBrand(product.getBrand())
                  .productImageUrl(product.getImageUrl())
                  .price(price)
                  .quantity(requestQuantity)
                  .subTotal(price.multiply(BigDecimal.valueOf(requestQuantity)))
                  .build();

            cartItemRepository.save(newItem);
        }

        updateCartTotal(cart);

        Cart updateCart = cartRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Cart tidak ditemukan"));
        
        return mapToCartResponse(updateCart);
      } catch (Exception e) {
        throw new RuntimeException("Gagal menambahkan item ke cart: " + e.getMessage());
      }   
    }

    @Override
    public CartResponse getMyCart(String email)
    {
        try {
            Cart cart = getOrCreateCart(email);

            updateCartTotal(cart);

            Cart updateCart = cartRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Cart tidak ditemukan"));
            
            return mapToCartResponse(updateCart); 
            
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil cart: " + e.getMessage());
        }
    }

    @Override
    public CartResponse updateCartItem(String email, Long itemId, UpdateCartItemRequest request)
    {
        try {
            CartItem cartItem = cartItemRepository.findByIdAndCartEmail(itemId, email)
                .orElseThrow(() -> new RuntimeException("Item cart tidak ditemukan"));
                
                cartItem.setQuantity(request.getQuantity());
                cartItem.setSubTotal(cartItem.getPrice().multiply(BigDecimal.valueOf(request.getQuantity())));
                
                cartItemRepository.save(cartItem);

            Cart cart = cartItem.getCart();
            
            updateCartTotal(cart);

            Cart updatedCart = cartRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Cart tidak ditemukan"));
            
            return mapToCartResponse(updatedCart);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengupdate item cart: " + e.getMessage());
        }
    }

    @Override
    public MessageResponse deleteCartItem(String email, Long itemId)
    {
        try {
            
            CartItem cartItem = cartItemRepository.findByIdAndCartEmail(itemId, email)
                .orElseThrow(() -> new RuntimeException("Item cart tidak ditemukan"));

            Cart cart = cartItem.getCart();

            updateCartTotal(cart);

            return MessageResponse.builder()
                .success(true)
                .message("Item cart berhasil dihapus")
                .build();
            
        } catch (Exception e) {
            throw new RuntimeException("Gagal menghapus item cart: " + e.getMessage());
        }

    }

    @Override
    @Transactional
    public MessageResponse clearCart(String email)
    {
        try {
            Cart cart = getOrCreateCart(email);

            cartItemRepository.deleteByCartEmail(email);

            cart.setTotalPrice(BigDecimal.ZERO);

            cartRepository.save(cart);

            return MessageResponse.builder()
                .success(true)
                .message("Cart berhasil dikosongkan")
                .build();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengosongkan cart: " + e.getMessage());
        }
    }

    private ProductClientResponse getProductFromProductClientResponse(Long productId) {
        try {
            return webClientBuilder.build()
                  .get()
                  .uri("http://PRODUCT-SERVICE/api/products/" + productId)
                  .retrieve()
                  .bodyToMono(ProductClientResponse.class)
                  .block();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data product: " + e.getMessage());
        }
    }
    
    private Cart getOrCreateCart(String email) {
        try {
            return cartRepository.findByEmail(email)
            .orElseGet(() -> {
                Cart newCart = Cart.builder()
                    .email(email)
                    .totalPrice(BigDecimal.ZERO)
                    .build();
                return cartRepository.save(newCart);
            });
        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat atau mengambil cart: " + e.getMessage());
        }
    }
    
    private void updateCartTotal(Cart cart)
    {
        try {
            List<CartItem> items = cart.getItems();

            BigDecimal totalPrice = items.stream()
                    .map(CartItem::getSubTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            cart.setTotalPrice(totalPrice);

            cartRepository.save(cart);
        } catch (Exception e) {
            throw new RuntimeException("Gagal menghitung total cart: " + e.getMessage());
        }

    }

    private CartResponse mapToCartResponse(Cart cart)
    {
        try {
            List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(this::mapToCartItemResponse)
                .toList();
            
            Integer totalItems = cart.getItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();

            return CartResponse.builder()
                .id(cart.getId())
                .email(cart.getEmail())
                .totalPrice(cart.getTotalPrice())
                .totalItems(totalItems)
                .items(itemResponses)
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt())
                .build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mapping cart : " + e.getMessage());
        }
    }

    private CartItemResponse mapToCartItemResponse(CartItem item)
    {
        try {
            return CartItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .productBrand(item.getProductBrand())
                .productImageUrl(item.getProductImageUrl())
                .price(item.getPrice())
                .quantity(item.getQuantity())
                .subTotal(item.getSubTotal())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mapping cart item: " + e.getMessage());
        }
    }
}
