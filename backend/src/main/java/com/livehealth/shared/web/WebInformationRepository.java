package com.livehealth.shared.web;

import com.livehealth.shared.web.WebInformation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WebInformationRepository extends JpaRepository<WebInformation, UUID> {
}
