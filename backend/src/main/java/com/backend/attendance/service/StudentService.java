package com.backend.attendance.service;

import com.backend.attendance.model.Student;
import com.backend.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final ExcelService excelService;

    /**
     * Derives the batch code from the batch name.
     *  - Contains "morning" → MG
     *  - Contains "evening" → EVE
     *  - Otherwise → first 3 characters uppercased
     */
    private String batchCode(String batchName) {
        if (batchName == null || batchName.isBlank()) return "STD";
        String lower = batchName.toLowerCase();
        if (lower.contains("morning")) return "MG";
        if (lower.contains("evening")) return "EV";
        // Generic: first 3 letters, no spaces
        String stripped = batchName.replaceAll("[^a-zA-Z]", "");
        return stripped.substring(0, Math.min(3, stripped.length())).toUpperCase();
    }

    /**
     * Generates a register number in the format: YY + BATCH_CODE + 3-digit sequence.
     * Examples: 26MG001, 26MG002 ... and independently 26EV001, 26EV002 ...
     *
     * The sequence is determined by counting how many students in the SAME coaching
     * centre already have a registerNumber that starts with the same YY+CODE prefix.
     * This guarantees fully independent counters per batch type per year.
     */
    private String generateRegisterNumber(Student student) {
        // YY from joinedDate (fallback: current year)
        LocalDate joined = student.getJoinedDate() != null ? student.getJoinedDate() : LocalDate.now();
        String yy = String.format("%02d", joined.getYear() % 100);

        String code = batchCode(student.getBatchName());

        // Prefix = e.g. "26MG" or "26EV" — count students with this prefix in the same centre
        String prefix = yy + code;
        long count = studentRepository.countByCoachingCentreIdAndRegisterNumberStartingWith(
                student.getCoachingCentreId(),
                prefix
        );

        String seq = String.format("%03d", count + 1);
        return prefix + seq;
    }

    public Student createStudent(Student student) {
        // Only generate if not already set
        if (student.getRegisterNumber() == null || student.getRegisterNumber().isBlank()) {
            student.setRegisterNumber(generateRegisterNumber(student));
        }
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
        students.forEach(s -> {
            s.setCoachingCentreId(coachingCentreId);
            if (s.getRegisterNumber() == null || s.getRegisterNumber().isBlank()) {
                s.setRegisterNumber(generateRegisterNumber(s));
            }
        });
        return studentRepository.saveAll(students);
    }
}

