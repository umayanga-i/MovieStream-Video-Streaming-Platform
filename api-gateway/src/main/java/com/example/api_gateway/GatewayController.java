package com.example.api_gateway;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class GatewayController {

    private final RestTemplate restTemplate;

    public GatewayController() {
        this.restTemplate = new RestTemplate();
    }

    @RequestMapping(value = "/api/auth/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<?> proxyAuth(HttpServletRequest request, @RequestBody(required = false) String body, HttpMethod method) {
        return proxyRequest(request, body, method, "http://localhost:8081");
    }

    @RequestMapping(value = "/api/watchlist/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<?> proxyWatchlist(HttpServletRequest request, @RequestBody(required = false) String body, HttpMethod method) {
        return proxyRequest(request, body, method, "http://localhost:8082");
    }

    @RequestMapping(value = "/api/stream/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<?> proxyStream(HttpServletRequest request, @RequestBody(required = false) String body, HttpMethod method) {
        return proxyRequest(request, body, method, "http://localhost:8083");
    }

    @RequestMapping(value = "/api/recommendations/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<?> proxyRecommendations(HttpServletRequest request, @RequestBody(required = false) String body, HttpMethod method) {
        return proxyRequest(request, body, method, "http://localhost:8084");
    }

    private ResponseEntity<?> proxyRequest(HttpServletRequest request, String body, HttpMethod method, String targetBaseUrl) {
        String path = request.getRequestURI();
        String query = request.getQueryString();
        String targetUrl = targetBaseUrl + path + (query != null ? "?" + query : "");

        HttpHeaders headers = new HttpHeaders();
        Collections.list(request.getHeaderNames()).forEach(headerName -> {
            headers.put(headerName, Collections.list(request.getHeaders(headerName)));
        });

        // Remove host header to avoid routing or hostname verification errors downstream
        headers.remove("host");

        HttpEntity<String> httpEntity = new HttpEntity<>(body, headers);
        try {
            return restTemplate.exchange(targetUrl, method, httpEntity, byte[].class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsByteArray());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Gateway proxy error: " + e.getMessage()));
        }
    }
}
