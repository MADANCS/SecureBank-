package com.securebank.service;

import com.securebank.entity.Nominee;
import com.securebank.repository.NomineeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class NomineeService {

    private final NomineeRepository nomineeRepository;

    public NomineeService(NomineeRepository nomineeRepository) {
        this.nomineeRepository = nomineeRepository;
    }

    public List<Nominee> getNominees(String accountNumber) {
        return nomineeRepository.findActiveByAccountNumber(accountNumber);
    }

    @Transactional
    public Nominee addNominee(String accountNumber, String nomineeName, String relationship,
                              String dateOfBirth, String phone, String email,
                              Integer sharePercentage, String createdBy) {
        // Validate total share doesn't exceed 100%
        int currentTotal = nomineeRepository.sumSharePercentageByAccount(accountNumber);
        if (currentTotal + sharePercentage > 100) {
            throw new IllegalArgumentException(
                "Total nominee share cannot exceed 100%. Current total: " + currentTotal + "%"
            );
        }
        Nominee nominee = new Nominee();
        nominee.setAccountNumber(accountNumber);
        nominee.setNomineeName(nomineeName);
        nominee.setRelationship(relationship);
        nominee.setDateOfBirth(dateOfBirth);
        nominee.setPhone(phone);
        nominee.setEmail(email);
        nominee.setSharePercentage(sharePercentage);
        nominee.setCreatedBy(createdBy);
        return nomineeRepository.save(nominee);
    }

    @Transactional
    public Nominee updateNominee(Long nomineeId, String accountNumber, String nomineeName,
                                 String relationship, String dateOfBirth, String phone,
                                 String email, Integer sharePercentage) {
        Nominee nominee = nomineeRepository.findActiveById(nomineeId, accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Nominee not found"));

        // Validate share doesn't exceed 100 when updated
        int currentTotal = nomineeRepository.sumSharePercentageByAccount(accountNumber);
        int diff = sharePercentage - nominee.getSharePercentage();
        if (currentTotal + diff > 100) {
            throw new IllegalArgumentException("Total nominee share cannot exceed 100%");
        }

        nominee.setNomineeName(nomineeName);
        nominee.setRelationship(relationship);
        nominee.setDateOfBirth(dateOfBirth);
        nominee.setPhone(phone);
        nominee.setEmail(email);
        nominee.setSharePercentage(sharePercentage);
        nominee.setUpdatedAt(Instant.now());
        return nomineeRepository.save(nominee);
    }

    @Transactional
    public void removeNominee(Long nomineeId, String accountNumber) {
        Nominee nominee = nomineeRepository.findActiveById(nomineeId, accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Nominee not found"));
        nominee.setDeletedAt(Instant.now());
        nomineeRepository.save(nominee);
    }
}
