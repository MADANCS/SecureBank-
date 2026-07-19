package com.securebank.repository;

import com.securebank.entity.RecurringPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface RecurringPaymentRepository extends JpaRepository<RecurringPayment, Long> {
    List<RecurringPayment> findAllByAccountNumber(String accountNumber);
    List<RecurringPayment> findAllByEnabledTrueAndNextExecutionAtBefore(Instant now);
}
