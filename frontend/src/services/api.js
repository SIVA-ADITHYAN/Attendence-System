import axios from 'axios';
import API_BASE_URL from '../config';

// On Android/mobile, localhost means the device itself — not your PC.
// Set VITE_API_BASE_URL in your .env file to your PC's local IP, e.g.:
//   VITE_API_BASE_URL=http://192.168.1.5:8080
// For web dev, leave it unset and the Vite proxy will handle /api calls.
const BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : `${API_BASE_URL}/api`;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Student APIs
export const studentAPI = {
    getAll: (page = 0, size = 10) => api.get(`/students?page=${page}&size=${size}`),
    getById: (id) => api.get(`/students/${id}`),
    getActive: () => api.get('/students/active'),
    getByCoachingCentre: (centreId, page = 0, size = 1000) =>
        api.get(`/students/coaching-centre/${centreId}?page=${page}&size=${size}`),
    getByTutor: (tutorId) => api.get(`/students/tutor/${tutorId}`),
    getByBatch: (batchName) => api.get(`/students/batch/${batchName}`),
    create: (student) => api.post('/students', student),
    update: (id, student) => api.put(`/students/${id}`, student),
    delete: (id) => api.delete(`/students/${id}`),
    uploadExcel: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/students/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

// Attendance APIs
export const attendanceAPI = {
    getAll: () => api.get('/attendance'),
    getById: (id) => api.get(`/attendance/${id}`),
    getByStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
    getByTutor: (tutorId) => api.get(`/attendance/tutor/${tutorId}`),
    getByDate: (date) => api.get(`/attendance/date/${date}`),
    getByDateAndCoachingCentre: (coachingCentreId, date) => 
        api.get(`/attendance/coaching-centre/${coachingCentreId}/date/${date}`),
    getByStatus: (status) => api.get(`/attendance/status/${status}`),
    getByDateRange: (studentId, startDate, endDate) =>
        api.get(`/attendance/student/${studentId}/range?startDate=${startDate}&endDate=${endDate}`),
    create: (attendance) => api.post('/attendance', attendance),
    update: (id, attendance) => api.put(`/attendance/${id}`, attendance),
    delete: (id) => api.delete(`/attendance/${id}`),
    checkOut: (id) => api.post(`/attendance/${id}/checkout`),
    faceCheckIn: (studentId, tutorId) => api.post('/attendance/face-checkin', { studentId, tutorId }),
};

// User APIs
export const userAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    getByEmail: (email) => api.get(`/users/email/${email}`),
    create: (user) => api.post('/users', user),
    update: (id, user) => api.put(`/users/${id}`, user),
    delete: (id) => api.delete(`/users/${id}`),
};

export default api;
