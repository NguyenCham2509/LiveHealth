package com.livehealth.shared.web;

import com.livehealth.shared.web.dto.request.webinfo.WebInformationRequestDto;
import com.livehealth.shared.web.dto.response.webinfo.WebInformationResponseDto;
import org.springframework.web.multipart.MultipartFile;

public interface WebInformationService {

    WebInformationResponseDto getWebInformation();

    WebInformationResponseDto updateWebInformation(WebInformationRequestDto request);

    WebInformationResponseDto uploadLogo(MultipartFile file);
}
