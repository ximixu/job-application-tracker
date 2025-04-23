/**
 * Parses job posting HTML content and extracts key information
 * @param {string} htmlContent - The HTML content of the job posting
 * @returns {Object} An object containing extracted job information
 */
function parseJobPosting(htmlContent) {
    // Create a temporary DOM element to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Helper function to clean text
    const cleanText = (text) => text ? text.trim().replace(/\s+/g, ' ') : '';

    // Helper function to find text content by common selectors
    const findTextBySelectors = (selectors) => {
        for (const selector of selectors) {
            const element = doc.querySelector(selector);
            if (element) return cleanText(element.textContent);
        }
        return '';
    };

    // Extract job information using common selectors
    const jobInfo = {
        company: findTextBySelectors([
            '[class*="company"]',
            '[class*="employer"]',
            '[class*="organization"]',
            'h2',
            'h3'
        ]),
        title: findTextBySelectors([
            '[class*="title"]',
            '[class*="position"]',
            'h1',
            'h2'
        ]),
        location: findTextBySelectors([
            '[class*="location"]',
            '[class*="address"]',
            '[class*="place"]'
        ]),
        description: findTextBySelectors([
            '[class*="description"]',
            '[class*="summary"]',
            '[class*="details"]',
            'p'
        ]),
        requirements: findTextBySelectors([
            '[class*="requirements"]',
            '[class*="qualifications"]',
            '[class*="skills"]',
            'ul'
        ]),
        salary: findTextBySelectors([
            '[class*="salary"]',
            '[class*="compensation"]',
            '[class*="pay"]'
        ])
    };

    // Additional processing for requirements if they're in a list
    const requirementsList = doc.querySelectorAll('ul li');
    if (requirementsList.length > 0) {
        jobInfo.requirements = Array.from(requirementsList)
            .map(li => cleanText(li.textContent))
            .filter(text => text.length > 0);
    }

    return jobInfo;
}

/**
 * Formats job posting text into a prompt for an LLM to parse
 * @param {string} jobPostingText - The raw text of the job posting
 * @returns {string} A formatted prompt for the LLM
 */
function createJobPostingPrompt(jobPostingText) {
    return `Please analyze this job posting and extract the following information in JSON format:
{
    "company": "company name",
    "title": "job title",
    "location": "job location",
    "description": "job description",
    "requirements": ["list of requirements"],
    "salary": "salary information if available"
}

Job Posting:
${jobPostingText}

Please provide only the JSON response, no additional text.`;
}

// Example usage:
// const jobPostingHTML = document.querySelector('.job-posting').innerHTML;
// const jobData = parseJobPosting(jobPostingHTML);
// console.log(jobData);

// const jobPostingText = "Paste job posting text here...";
// const prompt = createJobPostingPrompt(jobPostingText);
// console.log(prompt); 