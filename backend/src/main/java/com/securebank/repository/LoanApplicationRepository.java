package com.securebank.repository;

import com.securebank.entity.LoanApplication;
import com.securebank.entity.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    List<LoanApplication> findAllByApplicantUsername(String applicantUsername);
    List<LoanApplication> findAllByStatus(LoanStatus status);
    List<LoanApplication> findAllByStatusAndNextEmiAtBefore(LoanStatus status, Instant now);
}
