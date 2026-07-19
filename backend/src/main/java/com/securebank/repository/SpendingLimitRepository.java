package com.securebank.repository;

import com.securebank.entity.SpendingLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpendingLimitRepository extends JpaRepository<SpendingLimit, Long> {
    Optional<SpendingLimit> findByUsername(String username);
}
