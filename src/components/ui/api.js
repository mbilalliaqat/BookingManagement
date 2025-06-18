// frontend/src/ui/api.js

const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL; // Ensure this matches your backend URL

export const fetchEntryCounts = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/entry/counts`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.data; // Assumes backend returns { status: 'success', data: [...] }
    } catch (error) {
        console.error("Error fetching entry counts:", error);
        return null;
    }
};

// Modified to accept actualEntryNumber
export const incrementFormEntry = async (formType, actualEntryNumber) => {
    try {
        const response = await fetch(`${BASE_URL}/api/entry/increment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Pass actualEntryNumber in the request body
            body: JSON.stringify({ formType, actualEntryNumber }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.data; // Assumes backend returns { status: 'success', data: { formType, currentCount, globalCount } }
    } catch (error) {
        console.error("Error incrementing entry count:", error);
        return null;
    }
};