package com.baentech.product_service.service.serviceImpl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baentech.product_service.entity.Category;
import com.baentech.product_service.payload.req.CategoryRequest;
import com.baentech.product_service.payload.res.CategoryResponse;
import com.baentech.product_service.payload.res.MessageResponse;
import com.baentech.product_service.repository.CategoryRepository;
import com.baentech.product_service.service.CategoryService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    
    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public CategoryResponse createCategory(CategoryRequest request) 
    {
        try {
            if (categoryRepository.existsByNameIgnoreCase(request.getName())) {
                throw new RuntimeException("Kategori dengan nama " + request.getName() + " sudah ada");
            }

            Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
            
            Category savedCategory = categoryRepository.save(category);

            return mapToCategoryResponse(savedCategory);
        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat kategori : " + e.getMessage());   
        }
    }

    @Override
    public List<CategoryResponse> getAllCategories()
    {
        try {
            List<Category> categories = categoryRepository.findAll();

            return categories.stream()
                .map(this::mapToCategoryResponse)
                .toList();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil data kategori : " + e.getMessage());
        }

    }

    @Override
    public CategoryResponse getCategoryById(Long id)
    {
        try{
            Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kategori dengan id " + id + " tidak ditemukan"));

            return mapToCategoryResponse(category);
        }catch(Exception e) {
            throw new RuntimeException("Gagal mengambil data kategori : " + e.getMessage());

        }
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest request)
    {
        try {
            Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kategori dengan id " + id + " tidak ditemukan"));

                category.setName(request.getName());
                category.setDescription(request.getDescription());
                
                Category updateCategory= categoryRepository.save(category);

                return mapToCategoryResponse(updateCategory);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengubah kategory: " +e.getMessage());
        }
    }

    @Override
    public MessageResponse deleteCategory(Long id)
    {
        try {
            Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kategori tidak di temukan"));

            categoryRepository.delete(category);

            return MessageResponse.builder()
                .success(true)
                .message("Berhasil menghapus kategori")
                .build();
        } catch (Exception e) {
            throw new RuntimeException("Gagal menghapus kategori : " + e.getMessage());
        }
    }

    private CategoryResponse mapToCategoryResponse(Category category) 
    {
        try {
            return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
            
        } catch (Exception e) {
            throw new RuntimeException("Gagal mapping data kategori : " + e.getMessage());
        }

    }

}
