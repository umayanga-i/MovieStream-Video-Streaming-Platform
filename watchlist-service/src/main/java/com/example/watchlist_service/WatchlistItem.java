package com.example.watchlist_service;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "watchlist_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "userId", "movieId" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private Long movieId;

    @Column(nullable = false)
    private String movieTitle;

    @Column(name = "movie_poster_path")
    private String moviePosterPath;

    private Double movieRating;

    private String releaseDate;
}
