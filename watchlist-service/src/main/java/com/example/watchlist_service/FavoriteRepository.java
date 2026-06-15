package com.example.watchlist_service;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<FavoriteItem, Long> {
    List<FavoriteItem> findByUserId(String userId);
    Optional<FavoriteItem> findByUserIdAndMovieId(String userId, Long movieId);
    
    @Transactional
    void deleteByUserIdAndMovieId(String userId, Long movieId);
}
