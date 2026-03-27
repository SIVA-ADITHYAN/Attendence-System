package com.backend.attendance.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Proxy controller that forwards all /api/face/* requests to the Flask
 * MediaPipe face-recognition service.
 *
 * Why this exists:
 *   The Flask service runs on a different Render domain. Browsers block
 *   cross-origin requests (CORS). By proxying through Spring Boot we keep
 *   everything on a single origin from the browser's perspective — Spring
 *   Boot already has CORS configured for the Vercel frontend.
 */
@RestController
@RequestMapping("/api/face")
public class FaceProxyController {

    @Value("${face.api.url:https://attendence-system-zg1v.onrender.com}")
    private String faceApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── POST /api/face/register ───────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<Object> register(@RequestBody Map<String, Object> body) {
        return forward(HttpMethod.POST, "/api/face/register", body);
    }

    // ── POST /api/face/recognize ──────────────────────────────────
    @PostMapping("/recognize")
    public ResponseEntity<Object> recognize(@RequestBody Map<String, Object> body) {
        return forward(HttpMethod.POST, "/api/face/recognize", body);
    }

    // ── POST /api/face/recognize/fused ────────────────────────────
    @PostMapping("/recognize/fused")
    public ResponseEntity<Object> recognizeFused(@RequestBody Map<String, Object> body) {
        return forward(HttpMethod.POST, "/api/face/recognize/fused", body);
    }

    // ── POST /api/face/mesh ───────────────────────────────────────
    @PostMapping("/mesh")
    public ResponseEntity<Object> mesh(@RequestBody Map<String, Object> body) {
        return forward(HttpMethod.POST, "/api/face/mesh", body);
    }

    // ── GET /api/face/health ──────────────────────────────────────
    @GetMapping("/health")
    public ResponseEntity<Object> health() {
        return forward(HttpMethod.GET, "/health", null);
    }

    // ── Generic forwarder ─────────────────────────────────────────
    private ResponseEntity<Object> forward(HttpMethod method, String path, Object body) {
        String url = faceApiUrl + path;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Object> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Object> response = restTemplate.exchange(
                    url, method, entity, Object.class);
            return ResponseEntity
                    .status(response.getStatusCode())
                    .body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "error", "Face service unavailable",
                            "detail", e.getMessage()
                    ));
        }
    }
}
