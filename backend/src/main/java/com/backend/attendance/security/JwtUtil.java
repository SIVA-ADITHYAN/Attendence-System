package com.backend.attendance.security;

import com.backend.attendance.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    // 1. This grabs our secret key from the .env file.
    @Value("${JWT_SECRET}")
    private String secretKey;

    // 2. We set tokens to be valid for 24 hours (24 * 60 * 60 * 1000 ms)
    private static final long JWT_TOKEN_VALIDITY = 24 * 60 * 60 * 1000;

    // 3. This is the main method called during Login to create a token
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        // We embed public/safe information in the token
        claims.put("role", user.getRole().name());
        claims.put("userId", user.getId());
        claims.put("centreId", user.getCoachingCentreId());
        
        return createToken(claims, user.getEmail());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject) // the subject is the user's email
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY))
                .signWith(getSignKey(), SignatureAlgorithm.HS256) // Sign it with our secret key
                .compact();
    }

    // 4. Decodes the base64 secret from .env and turns it into a cryptographic Key
    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
    // 5. Utility methods to read data back OUT of the token later (used in the Auth Filter)
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // 6. Checks if the token belongs to the user and is still unexpired
    public Boolean validateToken(String token, User user) {
        final String username = extractUsername(token);
        return (username.equals(user.getEmail()) && !isTokenExpired(token));
    }
}
