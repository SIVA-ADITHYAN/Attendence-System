package com.backend.attendance.security;

import com.backend.attendance.model.User;
import com.backend.attendance.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Look for the "Authorization" header in the HTTP Request
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 2. Verify it exists and strictly starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // Pass straight through (will be blocked if route is secured)
            return;
        }

        // 3. Extract purely the token string
        jwt = authHeader.substring(7);
        try {
            userEmail = jwtUtil.extractUsername(jwt);
            
            // 4. If we successfully fetched the email and the user isn't logged in yet automatically
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                Optional<User> userOpt = userService.getUserByEmail(userEmail);

                // 5. Connect to the DB to verify the User exists, and mathematically validate the signature
                if (userOpt.isPresent() && jwtUtil.validateToken(jwt, userOpt.get())) {
                    
                    User user = userOpt.get();
                    
                    // Creates an authority role so you can use features like @PreAuthorize("hasRole('ADMIN')") later
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

                    // 6. Create the magical Auth object for Spring!
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            user,              // Store the FULL user object! It's super handy in controllers later.
                            null,             // No credentials
                            List.of(authority)// Their authorities
                    );

                    // Add details like the User's IP address (useful for request tracing)
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 7. Securely drop the Token into the Application Security Context! Let the Guard pass!
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Token is expired, missing, or utterly forged - do nothing (defaults to 401 Unauthorized)
            System.out.println("Failed to read JWT Token: " + e.getMessage());
        }

        // 8. Move onto the next stop in the chain
        filterChain.doFilter(request, response);
    }
}
