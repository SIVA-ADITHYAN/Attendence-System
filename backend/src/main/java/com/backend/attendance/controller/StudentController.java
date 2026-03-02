package com.backend.attendance.controller;

import com.backend.attendance.model.Student;
import com.backend.attendance.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    public ResponseEntity<Student> createStudent(@RequestBody Student student) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.createStudent(student));
    }

    @PostMapping("/upload")
    public ResponseEntity<List<Student>> uploadStudents(
            @RequestParam("file") MultipartFile file,
            @RequestParam("coachingCentreId") String coachingCentreId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studentService.createStudentsFromExcel(file, coachingCentreId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable String id) {
        return studentService.getStudentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<Page<Student>> getAllStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(studentService.getAllStudents(pageable));
    }

    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<Student>> getStudentsByTutorId(@PathVariable String tutorId) {
        return ResponseEntity.ok(studentService.getStudentsByTutorId(tutorId));
    }

    @GetMapping("/batch/{batchName}")
    public ResponseEntity<List<Student>> getStudentsByBatchName(@PathVariable String batchName) {
        return ResponseEntity.ok(studentService.getStudentsByBatchName(batchName));
    }

    @GetMapping("/active")
    public ResponseEntity<List<Student>> getActiveStudents() {
        return ResponseEntity.ok(studentService.getActiveStudents());
    }

    @GetMapping("/coaching-centre/{coachingCentreId}")
    public ResponseEntity<Page<Student>> getStudentsByCoachingCentreId(
            @PathVariable String coachingCentreId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(studentService.getStudentsByCoachingCentreId(coachingCentreId, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable String id, @RequestBody Student student) {
        return ResponseEntity.ok(studentService.updateStudent(id, student));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable String id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}
