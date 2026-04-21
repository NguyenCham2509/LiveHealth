package com.livehealth.auth;

import com.livehealth.shared.base.RestApiV1;
import com.livehealth.shared.base.RestData;
import com.livehealth.shared.base.VsResponseUtil;
import com.livehealth.shared.constant.UrlConstant;
import com.livehealth.auth.dto.request.*;
import com.livehealth.auth.dto.request.otp.VerifyOtpRequestDto;
import com.livehealth.shared.dto.CommonResponseDto;
import com.livehealth.auth.dto.response.LoginResponseDto;
import com.livehealth.auth.dto.response.TokenRefreshResponseDto;
import com.livehealth.user.dto.response.user.UserResponseDto;
import com.livehealth.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestApiV1
@Validated
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {
    AuthService authService;

    @Operation(summary = "Đăng nhập tài khoản", description = "Dùng để đăng nhập tài khoản")
    @PostMapping(UrlConstant.Auth.LOGIN)
    public ResponseEntity<RestData<LoginResponseDto>> login(@Valid @RequestBody LoginRequestDto requestDto) {
        LoginResponseDto response = authService.authentication(requestDto);
        return VsResponseUtil.success(response);
    }

    @Operation(summary = "Đăng xuất tài khoản", description = "Dùng để đăng xuất tài khoản")
    @PostMapping(UrlConstant.Auth.LOGOUT)
    public ResponseEntity<RestData<CommonResponseDto>> logout(@Valid @RequestBody LogoutRequestDto request) {
        CommonResponseDto response = authService.logout(request);
        return VsResponseUtil.success(response);
    }

    @Operation(summary = "Làm mới token", description = "Dùng để cấp lại token")
    @PostMapping(UrlConstant.Auth.REFRESH_TOKEN)
    public ResponseEntity<RestData<TokenRefreshResponseDto>> refresh(
            @Valid @RequestBody TokenRefreshRequestDto request) {
        TokenRefreshResponseDto response = authService.refresh(request);
        return VsResponseUtil.success(response);
    }

    @Operation(summary = "Đăng kí tài khoản", description = "Dùng để đăng kí tài khoản")
    @PostMapping(UrlConstant.Auth.REGISTER)
    public ResponseEntity<RestData<CommonResponseDto>> register(@Valid @RequestBody RegisterRequestDto requestDto) {
        CommonResponseDto response = authService.register(requestDto);
        return VsResponseUtil.success(HttpStatus.CREATED, response);
    }

    @Operation(summary = "Xác thực OTP", description = "Dùng để xác thực OTP sau khi yêu cầu đăng kí tài khoản")
    @PostMapping(UrlConstant.Auth.VERIFY_OTP)
    public ResponseEntity<RestData<UserResponseDto>> verify(@Valid @RequestBody VerifyOtpRequestDto request) {
        UserResponseDto response = authService.verifyOtpToRegister(request);
        return VsResponseUtil.success(response);
    }

    @Operation(summary = "Quên mật khẩu", description = "Dùng để lấy lại mật khẩu")
    @PostMapping(UrlConstant.Auth.FORGOT_PASSWORD)
    public ResponseEntity<RestData<CommonResponseDto>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDto request) {
        CommonResponseDto response = authService.forgotPassword(request);
        return VsResponseUtil.success(response);
    }

    @Operation(summary = "Xác thực OTP", description = "Dùng để xác thực OTP sau khi yêu cầu lấy lại mật khẩu")
    @PostMapping(UrlConstant.Auth.VERIFY_OTP_TO_RESET_PASSWORD)
    public ResponseEntity<RestData<CommonResponseDto>> verifyToResetPassword(
            @Valid @RequestBody VerifyOtpRequestDto request) {
        CommonResponseDto response = authService.verifyOtpToResetPassword(request);
        return VsResponseUtil.success(response);
    }

    @Operation(summary = "Đặt lại mật khẩu", description = "Dùng để đặt lại mật khẩu sau khi đã nhập được OTP")
    @PostMapping(UrlConstant.Auth.RESET_PASSWORD)
    public ResponseEntity<RestData<UserResponseDto>> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDto request) {
        UserResponseDto response = authService.resetPassword(request);
        return VsResponseUtil.success(response);
    }
}