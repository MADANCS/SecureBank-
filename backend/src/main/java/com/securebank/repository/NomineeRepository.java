package com.securebank.repository;

import com.securebank.entity.Nominee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface NomineeRepository extends JpaRepository<Nominee, Long> {
    @Query("SELECT n FROM Nominee n WHERE n.accountNumber = :accountNumber AND n.deletedAt IS NULL ORDER BY n.createdAt DESC")
    List<Nominee> findActiveByAccountNumber(String accountNumber);

    @Query("SELECT n FROM Nominee n WHERE n.id = :id AND n.accountNumber = :accountNumber AND n.deletedAt IS NULL")
    Optional<Nominee> findActiveById(Long id, String accountNumber);

    @Query("SELECT COALESCE(SUM(n.sharePercentage), 0) FROM Nominee n WHERE n.accountNumber = :accountNumber AND n.deletedAt IS NULL")
    Integer sumSharePercentageByAccount(String accountNumber);
}
