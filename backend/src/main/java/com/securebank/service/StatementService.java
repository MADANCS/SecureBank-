package com.securebank.service;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.securebank.entity.Account;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.TransactionRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class StatementService {
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public StatementService(AccountRepository accountRepository, TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    public byte[] generateAccountStatement(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        var transactions = transactionRepository.findAllByFromAccountOrToAccount(accountNumber, accountNumber, Pageable.unpaged());
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, outputStream);
            document.open();

            document.add(new Paragraph("SecureBank Account Statement"));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Account Number: " + account.getAccountNumber()));
            document.add(new Paragraph("Owner: " + account.getOwner().getUsername()));
            document.add(new Paragraph("Account Type: " + account.getAccountType()));
            document.add(new Paragraph("Current Balance: ₹ " + account.getBalance()));
            document.add(new Paragraph("Generated: " + DateTimeFormatter.ISO_INSTANT.format(java.time.Instant.now())));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(5);
            table.addCell(new Phrase("Date"));
            table.addCell(new Phrase("From"));
            table.addCell(new Phrase("To"));
            table.addCell(new Phrase("Amount"));
            table.addCell(new Phrase("Status"));

            transactions.forEach(tx -> {
                table.addCell(tx.getCreatedAt().toString());
                table.addCell(tx.getFromAccount());
                table.addCell(tx.getToAccount());
                table.addCell("₹ " + tx.getAmount());
                table.addCell(tx.getStatus());
            });

            document.add(table);
            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to generate statement pdf", e);
        }
    }
}
