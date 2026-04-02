import axios from 'axios';

/**
 * FingerprintService
 * Communicates with local biometric device services (e.g., Mantra RD Service).
 * Standard Mantra RD Service runs on http://localhost:11100
 */
class FingerprintService {
    constructor() {
        this.baseUrl = 'http://localhost:11100'; // Default Mantra port
    }

    /**
     * Check if the RD service is running and the device is connected.
     * @returns {Promise<boolean>}
     */
    async getDeviceStatus() {
        try {
            // Mantra RD Service Info call
            const response = await axios.get(`${this.baseUrl}/rd/info`);
            // Parse response (typically XML for RD services, but some might return JSON)
            return response.status === 200;
        } catch (error) {
            console.error('Fingerprint device not found or service not running:', error);
            return false;
        }
    }

    /**
     * Capture a fingerprint template.
     * Returns a Base64 string of the fingerprint template (minutiae).
     * @returns {Promise<string>}
     */
    async captureFingerprint() {
        try {
            // Mantra Capture XML request (standard RD Service format)
            const captureXml = `
                <Opts format="0" pidVer="2.0" timeout="10000" posh="UNKNOWN" env="P">
                    <Opts fType="1" fCount="1" iCount="0" iType="0" pCount="0" pType="0" format="0" pidVer="2.0" timeout="10000" posh="UNKNOWN" env="P" />
                </Opts>`;
            
            // Note: Different devices have different capture endpoints.
            // For Mantra MFS100: /rd/capture
            const response = await axios({
                method: 'CAPTURE',
                url: `${this.baseUrl}/rd/capture`,
                data: captureXml,
                headers: { 'Content-Type': 'text/xml' }
            });

            // The response is usually XML containing <PidData> and <Data type="Base64"> (the template)
            // For this implementation, we simulate extraction or assume we have a helper to parse it.
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response.data, "text/xml");
            
            // Extract the template data
            const pidData = xmlDoc.getElementsByTagName("PidData")[0];
            if (!pidData) throw new Error("No fingerprints captured");

            const dataTag = xmlDoc.getElementsByTagName("Data")[0];
            if (!dataTag) throw new Error("Failed to extract template data");

            return dataTag.textContent; // This is the Base64 template
        } catch (error) {
            console.error('Fingerprint capture failed:', error);
            throw error;
        }
    }

    /**
     * Mock identification (1:N matching).
     * Since we might not have a client-side matcher, we'll usually send the template
     * to the backend to compare against stored templates, OR use the device's native match if available.
     * @param {Array} students List of students with registered fingerprints
     * @param {string} capturedTemplate The currently captured template
     */
    async identify(students, capturedTemplate) {
        // In a real implementation, you'd call a backend endpoint that performs 1:N matching:
        // return await attendanceAPI.identifyByFingerprint(capturedTemplate);
        
        // For now, if we have local matching capability (rare in browser), we'd use it.
        // Otherwise, the backend handles it.
        return null; 
    }
}

export default new FingerprintService();
