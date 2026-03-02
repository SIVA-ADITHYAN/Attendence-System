package com.backend.attendance.service;

import com.backend.attendance.model.Student;
import com.backend.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final ExcelService excelService;

    public Student createStudent(Student student) {
        return studentRepository.save(student);
    }

    public Optional<Student> getStudentById(String id) {
        return studentRepository.findById(id);
    }

    public Page<Student> getAllStudents(Pageable pageable) {
        return studentRepository.findAll(pageable);
    }

    public List<Student> getStudentsByTutorId(String tutorId) {
        return studentRepository.findByTutorId(tutorId);
    }

    public List<Student> getStudentsByCoachingCentreId(String coachingCentreId) {
        return studentRepository.findByCoachingCentreId(coachingCentreId);
    }

    public Page<Student> getStudentsByCoachingCentreId(String coachingCentreId, Pageable pageable) {
        return studentRepository.findByCoachingCentreId(coachingCentreId, pageable);
    }

    public List<Student> getStudentsByBatchName(String batchName) {
        return studentRepository.findByBatchName(batchName);
    }

    public List<Student> getActiveStudents() {
        return studentRepository.findByIsActive(true);
    }

    public Student updateStudent(String id, Student student) {
        student.setId(id);
        return studentRepository.save(student);
    }

    public void deleteStudent(String id) {
        studentRepository.deleteById(id);
    }

    public List<Student> createStudentsFromExcel(MultipartFile file, String coachingCentreId) {
        List<Student> students = excelService.parseStudentsFromExcel(file);
        students.forEach(s -> s.setCoachingCentreId(coachingCentreId));
        return studentRepository.saveAll(students);
    }
}
