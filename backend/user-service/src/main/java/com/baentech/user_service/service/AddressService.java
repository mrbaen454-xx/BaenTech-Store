package com.baentech.user_service.service;

import java.util.List;

import com.baentech.user_service.payload.req.AddressRequest;
import com.baentech.user_service.payload.res.AddressResponse;
import com.baentech.user_service.payload.res.MessageResponse;

public interface AddressService {
    
    AddressResponse createAddress(String email, AddressRequest request); 

    List<AddressResponse> getMyAddresses(String email);

    AddressResponse getAddressById(String email, Long id);

    AddressResponse updateAddress(String email, Long id, AddressRequest request);

    MessageResponse deleteAddress(String email, Long id);

    AddressResponse setMainAddress(String email, Long id);
}
