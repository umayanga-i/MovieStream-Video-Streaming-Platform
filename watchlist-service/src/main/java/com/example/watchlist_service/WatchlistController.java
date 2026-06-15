package com.example.watchlist_service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/watchlist")
@CrossOrigin(origins = "*")
public class WatchlistController {

    private final WatchlistRepository watchlistRepository;
    private final FavoriteRepository favoriteRepository;

    @Value("${jwt.secret}")
    private String secret;

    @Autowired
    public WatchlistController(WatchlistRepository watchlistRepository, FavoriteRepository favoriteRepository) {
        this.watchlistRepository = watchlistRepository;
        this.favoriteRepository = favoriteRepository;
    }

    @GetMapping
    public ResponseEntity<?> getWatchlist(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            String userId = getUserIdFromToken(authHeader);
            List<WatchlistItem> items = watchlistRepository.findByUserId(userId);
            return ResponseEntity.ok(Map.of(
                    "success", "true",
                    "data", items
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", "false", "message", "Unauthorized: " + e.getMessage()));
        }
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToWatchlist(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody WatchlistRequest request) {
        try {
            String userId = getUserIdFromToken(authHeader);

            if (request.getMovieId() == null) {
                return ResponseEntity.badRequest().body(Map.of("success", "false", "message", "movieId is required"));
            }

            Optional<WatchlistItem> existing = watchlistRepository.findByUserIdAndMovieId(userId, request.getMovieId());
            if (existing.isEmpty()) {
                WatchlistItem item = WatchlistItem.builder()
                        .userId(userId)
                        .movieId(request.getMovieId())
                        .movieTitle(request.getMovieTitle() != null ? request.getMovieTitle() : "Unknown Movie")
                        .moviePosterPath(request.getMoviePosterPath())
                        .movieRating(request.getMovieRating())
                        .releaseDate(request.getReleaseDate())
                        .build();
                watchlistRepository.save(item);
            }

            return ResponseEntity.ok(Map.of("success", "true"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", "false", "message", "Unauthorized: " + e.getMessage()));
        }
    }

    @DeleteMapping("/remove/{movieId}")
    public ResponseEntity<?> removeFromWatchlist(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long movieId) {
        try {
            String userId = getUserIdFromToken(authHeader);
            watchlistRepository.deleteByUserIdAndMovieId(userId, movieId);
            return ResponseEntity.ok(Map.of("success", "true"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", "false", "message", "Unauthorized: " + e.getMessage()));
        }
    }

    @GetMapping("/favorites")
    public ResponseEntity<?> getFavorites(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            String userId = getUserIdFromToken(authHeader);
            List<FavoriteItem> items = favoriteRepository.findByUserId(userId);
            return ResponseEntity.ok(Map.of(
                    "success", "true",
                    "data", items
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", "false", "message", "Unauthorized: " + e.getMessage()));
        }
    }

    @PostMapping("/favorites/add")
    public ResponseEntity<?> addToFavorites(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody WatchlistRequest request) {
        try {
            String userId = getUserIdFromToken(authHeader);

            if (request.getMovieId() == null) {
                return ResponseEntity.badRequest().body(Map.of("success", "false", "message", "movieId is required"));
            }

            Optional<FavoriteItem> existing = favoriteRepository.findByUserIdAndMovieId(userId, request.getMovieId());
            if (existing.isEmpty()) {
                FavoriteItem item = FavoriteItem.builder()
                        .userId(userId)
                        .movieId(request.getMovieId())
                        .movieTitle(request.getMovieTitle() != null ? request.getMovieTitle() : "Unknown Movie")
                        .moviePosterPath(request.getMoviePosterPath())
                        .movieRating(request.getMovieRating())
                        .releaseDate(request.getReleaseDate())
                        .build();
                favoriteRepository.save(item);
            }

            return ResponseEntity.ok(Map.of("success", "true"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", "false", "message", "Unauthorized: " + e.getMessage()));
        }
    }

    @DeleteMapping("/favorites/remove/{movieId}")
    public ResponseEntity<?> removeFromFavorites(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long movieId) {
        try {
            String userId = getUserIdFromToken(authHeader);
            favoriteRepository.deleteByUserIdAndMovieId(userId, movieId);
            return ResponseEntity.ok(Map.of("success", "true"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", "false", "message", "Unauthorized: " + e.getMessage()));
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
