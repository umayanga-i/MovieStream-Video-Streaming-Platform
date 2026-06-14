package com.example.watchlist_service;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface WatchlistRepository extends JpaRepository<WatchlistItem, Long> {
    List<WatchlistItem> findByUserId(String userId);
    Optional<WatchlistItem> findByUserIdAndMovieId(String userId, Long movieId);

    @Transactional
    void deleteByUserIdAndMovieId(String userId, Long movieId);
}
