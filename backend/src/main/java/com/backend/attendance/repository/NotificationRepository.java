package com.backend.attendance.repository;
import com.backend.attendance.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByTutorIdOrderByTimestampDesc(String tutorId);
    List<Notification> findByTutorIdAndIsReadFalse(String tutorId);
}
