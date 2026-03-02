package com.backend.attendance.repository;

import com.backend.attendance.model.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends MongoRepository<Student, String> {
    List<Student> findByTutorId(String tutorId);

    List<Student> findByBatchName(String batchName);

    List<Student> findByIsActive(boolean isActive);

    List<Student> findByCoachingCentreId(String coachingCentreId);

    Page<Student> findByCoachingCentreId(String coachingCentreId, Pageable pageable);
}
