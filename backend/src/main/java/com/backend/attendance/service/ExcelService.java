package com.backend.attendance.service;

import com.backend.attendance.model.Student;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class ExcelService {

    public List<Student> parseStudentsFromExcel(MultipartFile file) {
        List<Student> students = new ArrayList<>();
        
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                Student student = Student.builder()
                        .studentName(getCellValue(row, 0))
                        .gender(getCellValue(row, 1))
                        .dateOfBirth(getDateValue(row, 2))
                        .schoolName(getCellValue(row, 3))
                        .standard(getCellValue(row, 4))
                        .parentName(getCellValue(row, 5))
                        .parentPhone(getCellValue(row, 6))
                        .parentAltPhone(getCellValue(row, 7))
                        .batchName(getCellValue(row, 8))
                        .batchStartTime(getTimeValue(row, 9))
                        .batchEndTime(getTimeValue(row, 10))
                        .tutorId(getCellValue(row, 11))
                        .address(getCellValue(row, 12))
                        .isActive(true)
                        .joinedDate(getDateValue(row, 13))
                        .build();
                
                students.add(student);
            }
        } catch (Exception e) {
            log.error("Error parsing Excel file: {}", e.getMessage());
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage());
        }
        
        return students;
    }

    private String getCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) return null;
        
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }

    private LocalDate getDateValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) return null;
        
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            }
        } catch (Exception e) {
            log.warn("Error parsing date at cell {}: {}", cellIndex, e.getMessage());
        }
        return null;
    }

    private LocalTime getTimeValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) return null;
        
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalTime();
            } else if (cell.getCellType() == CellType.STRING) {
                return LocalTime.parse(cell.getStringCellValue());
            }
        } catch (Exception e) {
            log.warn("Error parsing time at cell {}: {}", cellIndex, e.getMessage());
        }
        return null;
    }
}
