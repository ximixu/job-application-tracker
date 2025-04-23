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
    "description": "summarize the job description in one to two sentences",
    "salary": "salary information if available, just a number or range"
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