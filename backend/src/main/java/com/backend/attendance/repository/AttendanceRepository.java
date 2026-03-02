package com.backend.attendance.repository;

import com.backend.attendance.model.Attendance;
import com.backend.attendance.model.AttendanceStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends MongoRepository<Attendance, String> {
    List<Attendance> findByStudentId(String studentId);

    List<Attendance> findByTutorId(String tutorId);

    List<Attendance> findByDate(LocalDate date);

    List<Attendance> findByDateAndStudentIdIn(LocalDate date, List<String> studentIds);

    List<Attendance> findByStudentIdAndDate(String studentId, LocalDate date);

    List<Attendance> findByStudentIdAndDateBetween(String studentId, LocalDate startDate, LocalDate endDate);

    List<Attendance> findByStatus(AttendanceStatus status);

    Optional<Attendance> findByStudentIdAndDateAndTutorId(String studentId, LocalDate date, String tutorId);
}
