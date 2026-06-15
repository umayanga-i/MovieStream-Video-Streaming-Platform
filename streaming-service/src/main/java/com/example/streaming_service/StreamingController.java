package com.example.streaming_service;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = "*")
public class StreamingController {

    private final String apiKey = "3fd2be6f0c70a2a598f084ddfb75487c";
    private final String tmdbBaseUrl = "https://api.themoviedb.org/3";
    private final RestTemplate restTemplate;

    public StreamingController() {
        this.restTemplate = new RestTemplate();
    }

    @GetMapping("/{movieId}")
    public ResponseEntity<Void> getStreamUrl(@PathVariable String movieId) {
        try {
            String url = String.format("%s/movie/%s?api_key=%s", tmdbBaseUrl, movieId, apiKey);
            Map<?, ?> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("imdb_id")) {
                String imdbId = (String) response.get("imdb_id");
                if (imdbId != null && !imdbId.trim().isEmpty()) {
                    String targetUrl = "https://www.playimdb.com/title/" + imdbId.trim() + "/";
                    return ResponseEntity.status(HttpStatus.FOUND)
                            .location(URI.create(targetUrl))
                            .build();
                }
            }
            // Fallback: redirect to general playimdb URL if imdb_id is missing
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("https://www.playimdb.com/"))
                    .build();
        } catch (Exception e) {
            // Fallback on error
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("https://www.playimdb.com/"))
                    .build();
        }
    }
}
