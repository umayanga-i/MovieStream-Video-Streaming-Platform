package com.example.watchlist_service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistRequest {
    private Long movieId;
    private String movieTitle;
    private String moviePosterPath;
    private Double movieRating;
    private String releaseDate;
}
