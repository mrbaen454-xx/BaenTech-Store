package com.baentech.user_service.service.serviceImpl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.baentech.user_service.entity.Address;
import com.baentech.user_service.payload.req.AddressRequest;
import com.baentech.user_service.payload.res.AddressResponse;
import com.baentech.user_service.payload.res.MessageResponse;
import com.baentech.user_service.repository.AddressRepository;
import com.baentech.user_service.service.AddressService;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService
{
    
    private final AddressRepository addressRepository;

    @Override
    public AddressResponse createAddress(String email, AddressRequest request)
    {
        try {
            if (Boolean.TRUE.equals(request.getMainAddress())) {
                resetMainAddress(email);
            }

            Address address = Address.builder()
                    .email(email)
                    .recipientName(request.getRecipientName())
                    .phoneNumber(request.getPhoneNumber())
                    .fullAddress(request.getFullAddress())
                    .city(request.getCity())
                    .province(request.getProvince())
                    .postalCode(request.getPostalCode())
                    .mainAddress(request.getMainAddress() != null ? request.getMainAddress() : false)
                    .build();

            Address savedAddress = addressRepository.save(address);

            return mapToAddressResponse(savedAddress);
        } catch (Exception e) {
            throw new RuntimeException("Gagal menambah Alamat : " + e.getMessage());
        }
    }

    @Override
    public List<AddressResponse> getMyAddresses(String email)
    {
        try {
            List<Address> addresses = addressRepository.findByEmail(email);

            return addresses.stream().map(this::mapToAddressResponse).toList();
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil Alamat user : " + e.getMessage());
        }
    }

    @Override
    public AddressResponse getAddressById(String email,Long id)
    {
        try {
            Address address = addressRepository.findByIdAndEmail(id, email).orElseThrow(()-> new RuntimeException("Alamat tidak ditemukan "));

            return mapToAddressResponse(address);
            
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengambil Alamat user : " + e.getMessage());
        }
    }

    @Override
    public AddressResponse updateAddress(String email, Long id, AddressRequest request)
    {
        try {
            Address address = addressRepository.findByIdAndEmail(id, email).orElseThrow(()-> new RuntimeException("Alamat tidak ditemukan "));

            if (Boolean.TRUE.equals(request.getMainAddress())) {
                resetMainAddress(email);
            }

            address.setRecipientName(request.getRecipientName());
            address.setPhoneNumber(request.getPhoneNumber());
            address.setFullAddress(request.getFullAddress());
            address.setCity(request.getCity());
            address.setProvince(request.getProvince());
            address.setPostalCode(request.getPostalCode());
            address.setMainAddress(request.getMainAddress() != null ? request.getMainAddress() : address.getMainAddress());

            Address savedAddress = addressRepository.save(address);

            return mapToAddressResponse(savedAddress);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengubah Alamat :  " + e.getMessage());
        }
    }

    @Override
    public MessageResponse deleteAddress(String email, Long id)
    {
        try {
            Address address = addressRepository.findByIdAndEmail(id, email).orElseThrow(()-> new RuntimeException("Alamat tidak ditemukan "));

            addressRepository.delete(address);

            return MessageResponse.builder().success(true).message("Alamat berhasil dihapus").build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal menghapus Alamat : " + e.getMessage());
        }
    }

    @Override
    public AddressResponse setMainAddress(String email, Long id)
    {
        try {
            Address address = addressRepository.findByIdAndEmail(id, email).orElseThrow(()-> new RuntimeException("Alamat tidak ditemukan "));

            resetMainAddress(email);

            address.setMainAddress(true);

            Address savedAddress = addressRepository.save(address);

            return mapToAddressResponse(savedAddress);
        } catch (Exception e) {
            throw new RuntimeException("Gagal mengatur alamat utama : " + e.getMessage());
        }
    }
    private void resetMainAddress (String email)
    {
        try {
            List<Address> mainAddresses = addressRepository.findByEmailAndMainAddress(email, true);
            
            for (Address address : mainAddresses) {
                address.setMainAddress(false);
            }
            
            addressRepository.saveAll(mainAddresses);
            
        } catch (Exception e) {
            throw new RuntimeException("Gagal reset main address : " + e.getMessage());
        }
    }

    private AddressResponse mapToAddressResponse(Address address) {
        try {
            return AddressResponse.builder()
                   .id(address.getId())
                   .email(address.getEmail())
                   .recipientName(address.getRecipientName())
                   .phoneNumber(address.getPhoneNumber())
                   .fullAddress(address.getFullAddress())
                   .city(address.getCity())
                   .province(address.getProvince())
                   .postalCode(address.getPostalCode())
                   .mainAddress(address.getMainAddress())
                   .createdAt(address.getCreatedAt())
                   .updatedAt(address.getUpdatedAt())
                   .build();

        } catch (Exception e) {
            throw new RuntimeException("Gagal Mapping address : " + e.getMessage());
        }
    }
     
}
