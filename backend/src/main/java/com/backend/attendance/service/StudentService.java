package com.backend.attendance.service;

import com.backend.attendance.model.Student;
import com.backend.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    // Static sequence map to cache counters per centre+prefix, ensuring speed across bulk inserts without relying on count()
    private static final Map<String, Integer> sequenceCounters = new HashMap<>();

    /**
     * Generates a register number in the format: YY + BATCH_CODE + 3-digit sequence.
     * Examples: 24MG001, 24MG002 ... and independently 24EV001, 24EV002 ...
     * It tracks the MAX sequence from the DB first and then statically holds sequence in memory.
     */
    private synchronized String generateRegisterNumber(Student student) {
        // YY from joinedDate (fallback: current year)
        LocalDate joined = student.getJoinedDate() != null ? student.getJoinedDate() : LocalDate.now();
        String yy = String.format("%02d", joined.getYear() % 100);

        String code = batchCode(student.getBatchName());
        String prefix = yy + code;
        String counterKey = student.getCoachingCentreId() + "_" + prefix;

        // Initialize from DB if not present in memory
        if (!sequenceCounters.containsKey(counterKey)) {
            Student lastStudent = studentRepository.findTopByCoachingCentreIdAndRegisterNumberStartingWithOrderByRegisterNumberDesc(
                    student.getCoachingCentreId(), prefix);

            int startSeq = 1;
            if (lastStudent != null && lastStudent.getRegisterNumber() != null) {
                String lastReg = lastStudent.getRegisterNumber();
                try {
                    // Expect format: '24MG005' where prefix is '24MG', rest is '005'
                    String seqStr = lastReg.substring(prefix.length());
                    startSeq = Integer.parseInt(seqStr) + 1;
                } catch (Exception e) {
                    // Fallback to count + 1 on parse error
                    startSeq = (int) studentRepository.countByCoachingCentreIdAndRegisterNumberStartingWith(student.getCoachingCentreId(), prefix) + 1;
                }
            } else {
                startSeq = (int) studentRepository.countByCoachingCentreIdAndRegisterNumberStartingWith(student.getCoachingCentreId(), prefix) + 1;
            }
            sequenceCounters.put(counterKey, startSeq);
        }

        int seq = sequenceCounters.get(counterKey);
        sequenceCounters.put(counterKey, seq + 1);

        String seqStr = String.format("%03d", seq);
        return prefix + seqStr;
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

