package com.example.Recommendation_service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${tmdb.api.key}")
    private String apiKey;

    @Value("${tmdb.base.url}")
    private String tmdbBaseUrl;

    @Value("${watchlist.service.url}")
    private String watchlistServiceUrl;

    private final RestTemplate restTemplate;

    public RecommendationController() {
        this.restTemplate = new RestTemplate();
    }

    @GetMapping
    @SuppressWarnings({"unchecked", "rawtypes"})
    public ResponseEntity<?> getRecommendations(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // 1. Verify Authentication Token
            getUserIdFromToken(authHeader);

            // 2. Fetch User's Watchlist from Watchlist Service
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authHeader);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> watchlistResponse;
            try {
                watchlistResponse = restTemplate.exchange(watchlistServiceUrl, HttpMethod.GET, entity, Map.class);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("success", false, "message", "Error calling watchlist service: " + e.getMessage()));
            }

            if (watchlistResponse.getStatusCode() != HttpStatus.OK || watchlistResponse.getBody() == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("success", false, "message", "Invalid response from watchlist service"));
            }

            List<Map<String, Object>> watchlistItems = (List<Map<String, Object>>) watchlistResponse.getBody().get("data");

            // 3. Recommendation Logic
            List<Map<String, Object>> recommendedMovies = new ArrayList<>();

            if (watchlistItems == null || watchlistItems.isEmpty()) {
                // FALLBACK: Watchlist is empty, fetch popular movies
                String popularUrl = String.format("%s/movie/popular?api_key=%s&page=1", tmdbBaseUrl, apiKey);
                Map<String, Object> popularResponse = restTemplate.getForObject(popularUrl, Map.class);
                if (popularResponse != null && popularResponse.containsKey("results")) {
                    recommendedMovies = (List<Map<String, Object>>) popularResponse.get("results");
                }
            } else {
                // Watchlist is not empty, perform personalized recommendations
                Set<Long> watchlistMovieIds = watchlistItems.stream()
                        .map(item -> {
                            Object idVal = item.get("movieId");
                            if (idVal instanceof Number) {
                                return ((Number) idVal).longValue();
                            } else if (idVal instanceof String) {
                                return Long.parseLong((String) idVal);
                            }
                            return 0L;
                        })
                        .filter(id -> id > 0)
                        .collect(Collectors.toSet());

                // A. Find Genres of the last 5 movies in the watchlist
                int itemsToProcessForGenres = Math.min(watchlistItems.size(), 5);
                List<Map<String, Object>> recentWatchlist = watchlistItems.subList(watchlistItems.size() - itemsToProcessForGenres, watchlistItems.size());
                
                Map<Integer, Integer> genreCounts = new HashMap<>();
                for (Map<String, Object> item : recentWatchlist) {
                    try {
                        Object idVal = item.get("movieId");
                        long movieId = 0;
                        if (idVal instanceof Number) {
                            movieId = ((Number) idVal).longValue();
                        } else if (idVal instanceof String) {
                            movieId = Long.parseLong((String) idVal);
                        }
                        if (movieId == 0) continue;

                        String detailsUrl = String.format("%s/movie/%d?api_key=%s", tmdbBaseUrl, movieId, apiKey);
                        Map<String, Object> details = restTemplate.getForObject(detailsUrl, Map.class);
                        if (details != null && details.containsKey("genres")) {
                            List<Map<String, Object>> genres = (List<Map<String, Object>>) details.get("genres");
                            for (Map<String, Object> genre : genres) {
                                int genreId = ((Number) genre.get("id")).intValue();
                                genreCounts.put(genreId, genreCounts.getOrDefault(genreId, 0) + 1);
                            }
                        }
                    } catch (Exception e) {
                        // Ignore details error for individual movies, proceed with others
                    }
                }

                // Sort genres by frequency to find top genres
                List<Integer> topGenres = genreCounts.entrySet().stream()
                        .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                        .map(Map.Entry::getKey)
                        .limit(2)
                        .collect(Collectors.toList());

                // B. Fetch recommendations for the last 3 movies in the watchlist
                Map<Long, Map<String, Object>> recommendationsMap = new HashMap<>();
                int itemsToProcessForRecommendations = Math.min(watchlistItems.size(), 3);
                List<Map<String, Object>> recWatchlist = watchlistItems.subList(watchlistItems.size() - itemsToProcessForRecommendations, watchlistItems.size());

                for (Map<String, Object> item : recWatchlist) {
                    try {
                        Object idVal = item.get("movieId");
                        long movieId = 0;
                        if (idVal instanceof Number) {
                            movieId = ((Number) idVal).longValue();
                        } else if (idVal instanceof String) {
                            movieId = Long.parseLong((String) idVal);
                        }
                        if (movieId == 0) continue;

                        String recUrl = String.format("%s/movie/%d/recommendations?api_key=%s", tmdbBaseUrl, movieId, apiKey);
                        Map<String, Object> recResponse = restTemplate.getForObject(recUrl, Map.class);
                        if (recResponse != null && recResponse.containsKey("results")) {
                            List<Map<String, Object>> results = (List<Map<String, Object>>) recResponse.get("results");
                            for (Map<String, Object> movie : results) {
                                long movieApiId = ((Number) movie.get("id")).longValue();
                                recommendationsMap.put(movieApiId, movie);
                            }
                        }
                    } catch (Exception e) {
                        // Ignore individual recommendations fetch failures
                    }
                }

                // C. Fetch discover movies matching top genres
                if (!topGenres.isEmpty()) {
                    try {
                        String genreQueryParam = topGenres.stream()
                                .map(String::valueOf)
                                .collect(Collectors.joining(","));
                        String discoverUrl = String.format("%s/discover/movie?api_key=%s&with_genres=%s&sort_by=popularity.desc", tmdbBaseUrl, apiKey, genreQueryParam);
                        Map<String, Object> discoverResponse = restTemplate.getForObject(discoverUrl, Map.class);
                        if (discoverResponse != null && discoverResponse.containsKey("results")) {
                            List<Map<String, Object>> results = (List<Map<String, Object>>) discoverResponse.get("results");
                            for (Map<String, Object> movie : results) {
                                long movieApiId = ((Number) movie.get("id")).longValue();
                                recommendationsMap.put(movieApiId, movie);
                            }
                        }
                    } catch (Exception e) {
                        // Ignore discover failures
                    }
                }

                // D. Filter out movies already in the watchlist and sort by popularity/rating
                List<Map<String, Object>> filteredRecommendations = recommendationsMap.values().stream()
                        .filter(movie -> {
                            long movieApiId = ((Number) movie.get("id")).longValue();
                            return !watchlistMovieIds.contains(movieApiId);
                        })
                        .sorted((m1, m2) -> {
                            // Sort by popularity descending as first criteria, or vote_average
                            double pop1 = m1.containsKey("popularity") ? ((Number) m1.get("popularity")).doubleValue() : 0.0;
                            double pop2 = m2.containsKey("popularity") ? ((Number) m2.get("popularity")).doubleValue() : 0.0;
                            return Double.compare(pop2, pop1);
                        })
                        .limit(20)
                        .collect(Collectors.toList());

                recommendedMovies = filteredRecommendations;
            }

            // 4. Return standard search/discover page response format
            return ResponseEntity.ok(Map.of(
                    "results", recommendedMovies,
                    "page", 1,
                    "total_pages", 1
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Unauthorized: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Internal Server Error: " + e.getMessage()));
        }
    }

    private String getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid Authorization header");
        }
        String token = authHeader.substring(7);
        Algorithm algorithm = Algorithm.HMAC256(secret);
        JWTVerifier verifier = JWT.require(algorithm).withIssuer("auth-service").build();
        DecodedJWT jwt = verifier.verify(token);
        return jwt.getSubject();
    }
}
