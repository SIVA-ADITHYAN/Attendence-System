package com.backend.attendance.repository;

import com.backend.attendance.model.CoachingCentre;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachingCentreRepository extends MongoRepository<CoachingCentre, String> {
    List<CoachingCentre> findByIsActive(Boolean isActive);
}
