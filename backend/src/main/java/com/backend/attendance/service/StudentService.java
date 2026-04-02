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

    public Page<Student> getStudentsByTutorId(String tutorId, Pageable pageable) {
        return studentRepository.findByTutorId(tutorId, pageable);
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

    public Student updateStudent(String id, Student updatedStudent) {
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));

        // Update fields that are present in updatedStudent
        if (updatedStudent.getStudentName() != null) existing.setStudentName(updatedStudent.getStudentName());
        if (updatedStudent.getGender() != null) existing.setGender(updatedStudent.getGender());
        if (updatedStudent.getDateOfBirth() != null) existing.setDateOfBirth(updatedStudent.getDateOfBirth());
        if (updatedStudent.getSchoolName() != null) existing.setSchoolName(updatedStudent.getSchoolName());
        if (updatedStudent.getStandard() != null) existing.setStandard(updatedStudent.getStandard());
        if (updatedStudent.getParentName() != null) existing.setParentName(updatedStudent.getParentName());
        if (updatedStudent.getParentPhone() != null) existing.setParentPhone(updatedStudent.getParentPhone());
        if (updatedStudent.getParentAltPhone() != null) existing.setParentAltPhone(updatedStudent.getParentAltPhone());
        if (updatedStudent.getBatchName() != null) existing.setBatchName(updatedStudent.getBatchName());
        if (updatedStudent.getBatchStartTime() != null) existing.setBatchStartTime(updatedStudent.getBatchStartTime());
        if (updatedStudent.getBatchEndTime() != null) existing.setBatchEndTime(updatedStudent.getBatchEndTime());
        if (updatedStudent.getCoachingCentreId() != null) existing.setCoachingCentreId(updatedStudent.getCoachingCentreId());
        if (updatedStudent.getTutorId() != null) existing.setTutorId(updatedStudent.getTutorId());
        if (updatedStudent.getAddress() != null) existing.setAddress(updatedStudent.getAddress());
        if (updatedStudent.getIsActive() != null) existing.setIsActive(updatedStudent.getIsActive());
        if (updatedStudent.getJoinedDate() != null) existing.setJoinedDate(updatedStudent.getJoinedDate());
        if (updatedStudent.getLeftDate() != null) existing.setLeftDate(updatedStudent.getLeftDate());

        // Note: faceRegistered, faceEmbedding, fingerprintRegistered, fingerprintTemplate 
        // are PRESERVED unless explicitly updated via their specific registration endpoints.
        // We do NOT update them here to avoid accidental overrides from basic info forms.

        return studentRepository.save(existing);
    }

    public Student registerFingerprint(String id, String template) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        student.setFingerprintTemplate(template);
        student.setFingerprintRegistered(true);
        return studentRepository.save(student);
    }

    public void deleteStudent(String id) {
        studentRepository.deleteById(id);
    }

    public List<Student> createStudentsFromExcel(MultipartFile file, String coachingCentreId, String tutorId) {
        List<Student> students = excelService.parseStudentsFromExcel(file);
        students.forEach(s -> {
            s.setCoachingCentreId(coachingCentreId);
            if (tutorId != null && !tutorId.trim().isEmpty()) {
                s.setTutorId(tutorId);
            }
            if (s.getRegisterNumber() == null || s.getRegisterNumber().isBlank()) {
                s.setRegisterNumber(generateRegisterNumber(s));
            }
        });
        return studentRepository.saveAll(students);
    }
}

