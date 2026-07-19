package com.securebank.service;

import com.securebank.entity.User;
import com.securebank.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionPinService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public TransactionPinService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Set or update the transaction PIN for a user.
     * PIN is BCrypt-hashed separately from the login password.
     */
    @Transactional
    public void setPin(String username, String currentPassword, String newPin) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Require current login password to change transaction PIN
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (newPin == null || !newPin.matches("\\d{4,6}")) {
            throw new IllegalArgumentException("PIN must be 4-6 digits");
        }

        user.setTransactionPin(passwordEncoder.encode(newPin));
        userRepository.save(user);
    }

    /**
     * Verify the transaction PIN before processing a transfer.
     */
    public boolean verifyPin(String username, String pin) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getTransactionPin() == null) {
            throw new IllegalStateException("Transaction PIN not set. Please set a PIN before making transfers.");
        }

        return passwordEncoder.matches(pin, user.getTransactionPin());
    }

    /**
     * Check if the user has a transaction PIN set.
     */
    public boolean hasPinSet(String username) {
        return userRepository.findByUsername(username)
                .map(u -> u.getTransactionPin() != null)
                .orElse(false);
    }
}
