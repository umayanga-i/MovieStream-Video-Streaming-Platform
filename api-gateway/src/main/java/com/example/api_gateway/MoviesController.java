package com.example.api_gateway;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = "*")
public class MoviesController {

    private final String apiKey = "3fd2be6f0c70a2a598f084ddfb75487c";
    private final String tmdbBaseUrl = "https://api.themoviedb.org/3";
    private final RestTemplate restTemplate;

    public MoviesController() {
        this.restTemplate = new RestTemplate();
    }

    @GetMapping("/trending")
    public ResponseEntity<String> getTrending(@RequestParam(defaultValue = "1") int page) {
        String url = String.format("%s/trending/movie/day?api_key=%s&page=%d", tmdbBaseUrl, apiKey, page);
        return restTemplate.getForEntity(url, String.class);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<String> getUpcoming(@RequestParam(defaultValue = "1") int page) {
        String url = String.format("%s/movie/upcoming?api_key=%s&page=%d", tmdbBaseUrl, apiKey, page);
        return restTemplate.getForEntity(url, String.class);
    }

    @GetMapping("/top_rated")
    public ResponseEntity<String> getTopRated(@RequestParam(defaultValue = "1") int page) {
        String url = String.format("%s/movie/top_rated?api_key=%s&page=%d", tmdbBaseUrl, apiKey, page);
        return restTemplate.getForEntity(url, String.class);
    }

    @GetMapping("/popular")
    public ResponseEntity<String> getPopular(@RequestParam(defaultValue = "1") int page) {
        String url = String.format("%s/movie/popular?api_key=%s&page=%d", tmdbBaseUrl, apiKey, page);
        return restTemplate.getForEntity(url, String.class);
    }

    @GetMapping("/search")
    public ResponseEntity<String> searchMovies(@RequestParam String query, @RequestParam(defaultValue = "1") int page) {
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = String.format("%s/search/movie?api_key=%s&query=%s&page=%d", tmdbBaseUrl, apiKey, encodedQuery, page);
        return restTemplate.getForEntity(url, String.class);
    }

    @GetMapping("/details/{movieId}")
    public ResponseEntity<String> getDetails(@PathVariable String movieId) {
        String url = String.format("%s/movie/%s?api_key=%s&append_to_response=credits", tmdbBaseUrl, movieId, apiKey);
        return restTemplate.getForEntity(url, String.class);
    }

    @GetMapping("/genres")
    public ResponseEntity<String> getGenres() {
        String url = String.format("%s/genre/movie/list?api_key=%s", tmdbBaseUrl, apiKey);
        return restTemplate.getForEntity(url, String.class);
    }

    @GetMapping("/filter")
    public ResponseEntity<String> filterMovies(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String rating,
            @RequestParam(required = false) String year) {

        StringBuilder urlBuilder = new StringBuilder(tmdbBaseUrl)
                .append("/discover/movie?api_key=")
                .append(apiKey)
                .append("&page=")
                .append(page);

        if (genre != null && !genre.isEmpty() && !"null".equalsIgnoreCase(genre)) {
            urlBuilder.append("&with_genres=").append(genre);
        }
        if (year != null && !year.isEmpty() && !"null".equalsIgnoreCase(year)) {
            urlBuilder.append("&primary_release_year=").append(year);
        }
        if (rating != null && !rating.isEmpty() && !"null".equalsIgnoreCase(rating)) {
            urlBuilder.append("&vote_average.gte=").append(rating);
        }

        String sortBy = "popularity.desc";
        if ("top_rated".equalsIgnoreCase(category)) {
            sortBy = "vote_average.desc";
            urlBuilder.append("&vote_count.gte=100"); 
        } else if ("upcoming".equalsIgnoreCase(category)) {
            sortBy = "release_date.desc";
        }
        urlBuilder.append("&sort_by=").append(sortBy);

        return restTemplate.getForEntity(urlBuilder.toString(), String.class);
    }
}
