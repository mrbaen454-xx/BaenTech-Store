package com.baentech.user_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baentech.user_service.entity.Address;

public interface AddressRepository extends JpaRepository<Address, Long> 
{
    List<Address> findByEmail(String email);

    Optional<Address> findByIdAndEmail(Long id, String email);

    List<Address> findByEmailAndMainAddress(String email, Boolean mainAddress);
    
}
