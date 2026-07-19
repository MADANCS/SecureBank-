package com.securebank.repository;

import com.securebank.entity.AccountFreezeHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountFreezeHistoryRepository extends JpaRepository<AccountFreezeHistory, Long> {
    Page<AccountFreezeHistory> findByAccountNumber(String accountNumber, Pageable pageable);
}
