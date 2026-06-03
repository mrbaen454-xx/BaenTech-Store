package com.baentech.product_service.service.serviceImpl;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.baentech.product_service.entity.Category;
import com.baentech.product_service.entity.Product;
import com.baentech.product_service.entity.ProductStatus;
import com.baentech.product_service.payload.req.ProductRequest;
import com.baentech.product_service.payload.res.MessageResponse;
import com.baentech.product_service.payload.res.ProductResponse;
import com.baentech.product_service.repository.CategoryRepository;
import com.baentech.product_service.repository.ProductRepository;
import com.baentech.product_service.service.ProductService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public ProductResponse createProduct(ProductRequest request) {
        try {
            Category categori = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Kategori dengan id " + request.getCategoryId() + " tidak ditemukan"));

            ProductStatus status = request.getStatus();

            if (status == null) {
                status = ProductStatus.ACTIVE;
            }

            if (request.getStock() <= 0) {
                status = ProductStatus.OUT_OF_STOCK;
            }

            Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .brand(request.getBrand())
                .price(request.getPrice())
                .stock(request.getStock())
                .warranty(request.getWarranty())
                .status(status)
                .category(categori)
                .build();
            
            Product savedProduct = productRepository.save(product);
            return mapToProductResponse(savedProduct);

        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat produk : " + e.getMessage());
        }
    }

    @Override
    public List<ProductResponse> getAllProducts() {
        try {
            List<Product> products = productRepository.findAll();

            return products.stream()
                .map(this::mapToProductResponse)
                .toList();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data produk : " + e.getMessage());
        }
    
    }

    @Override
    public ProductResponse getProductById(Long id) {
        try {
            Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produk dengan id " + id + " tidak ditemukan"));

            return mapToProductResponse(product);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil detail produk : " + e.getMessage());
        }
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        try {
            
            Product product = productRepository.findById(id)
                   .orElseThrow(()-> new RuntimeException("Produk dengan id " + id + " tidak ditemukan"));
            
            Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Kategori dengan id " + request.getCategoryId() + " tidak ditemukan"));

            ProductStatus status = request.getStatus();

            if (status == null) {
                status = request.getStatus();
            }

            if (request.getStock() <= 0) {
                status = ProductStatus.OUT_OF_STOCK;
            }

            product.setName(request.getName());
            product.setDescription(request.getDescription());
            product.setBrand(request.getBrand());
            product.setPrice(request.getPrice());
            product.setStock(request.getStock());
            product.setWarranty(request.getWarranty());
            product.setStatus(status);
            product.setCategory(category);
            
            Product updateProduct = productRepository.save(product);
            return mapToProductResponse(updateProduct);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengubah produk : " + e.getMessage());
        }
    }

    @Override
    public MessageResponse deleteProduct(Long id) 
    {
        try {
            Product product = productRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Produk dengan id " + id + " tidak ditemukan"));

            productRepository.delete(product);
            return MessageResponse.builder()
                .success(true)
                .message("Berhasil menghapus produk")
                .build();
        } catch (Exception e) {
            throw new RuntimeException("Gagal menghapus produk : " + e.getMessage());
        }
    }
    @Override
    public List<ProductResponse> searchProducts(String keyword)
    {
        try {
            List<Product> products = productRepository.findByNameContainingIgnoreCase(keyword);

            return products.stream()
                .map(this::mapToProductResponse)
                .toList();

        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data produk berdasarkan kategori : " + e.getMessage());
        }
    }

    @Override 
    public List<ProductResponse> getProductsByCategory(Long categoryId) 
    {
       try {
        List<Product> products = productRepository.findByCategoryId(categoryId);

        return products.stream()
            .map(this::mapToProductResponse)
            .toList();

       } catch (Exception e) {
        throw new RuntimeException("Gagal mengambil data produk berdasarkan kategori : " + e.getMessage());
       }
    }

    @Override
    public List<ProductResponse> getProductsByBrand(String brand)
    {
        try {
            List<Product> product = productRepository.findByBrandIgnoreCase(brand);

            return product.stream()
                .map(this::mapToProductResponse)
                .toList();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data produk berdasarkan merk : " + e.getMessage());
        }
    }
    
    @Override
    public ProductResponse uploadProductImage(Long productId, MultipartFile file) {
        try {
            Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan"));

            if (file == null || file.isEmpty()) {
                throw new RuntimeException("File gambar tidak boleh kosong");
            }

            String contentType = file.getContentType();

            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("File harus berupa gambar");
            }

            String uploadDir = "uploads/products";

            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();

            if (originalFilename == null || originalFilename.isBlank()) {
                throw new RuntimeException("Nama file tidak valid");
            }

            String extension = "";

            int dotIndex = originalFilename.lastIndexOf(".");
            if (dotIndex >= 0) {
                extension = originalFilename.substring(dotIndex);
            }

            String fileName = "product-" + productId + "-" + System.currentTimeMillis() + extension;

            Path filePath = Paths.get(uploadDir, fileName);

            Files.write(filePath, file.getBytes());

            String imageUrl = "/uploads/products/" + fileName;

            product.setImageUrl(imageUrl);

            Product savedProduct = productRepository.save(product);

            return mapToProductResponse(savedProduct);

        } catch (Exception e) {
            throw new RuntimeException("Gagal upload gambar produk: " + e.getMessage());
        }
    }
    private ProductResponse mapToProductResponse(Product product) 
    {
        try {
            return ProductResponse.builder()
                    .id(product.getId())
                    .name(product.getName())
                    .description(product.getDescription())
                    .brand(product.getBrand())
                    .imageUrl(product.getImageUrl())
                    .price(product.getPrice())
                    .stock(product.getStock())
                    .warranty(product.getWarranty())
                    .status(product.getStatus())
                    .categoryId(product.getCategory().getId())
                    .categoryName(product.getCategory().getName())
                    .createdAt(product.getCreatedAt())
                    .updatedAt(product.getUpdatedAt())
                    .build();
            
        } catch (Exception e) {
            throw new RuntimeException("Gagal mapping data produk : " + e.getMessage());
        }
    }
    
    
}
