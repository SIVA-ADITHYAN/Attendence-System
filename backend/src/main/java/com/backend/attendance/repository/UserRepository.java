package com.backend.attendance.repository;

import com.backend.attendance.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    boolean existsByEmail(String email);

    java.util.List<User> findByCoachingCentreIdAndRole(String coachingCentreId, com.backend.attendance.model.Role role);

    Optional<User> findByCoachingCentreIdAndRoleAndId(String coachingCentreId, com.backend.attendance.model.Role role,
            String id);
}
