/**
 * Formats job posting text into a prompt for an LLM to parse
 * @param {string} jobPostingText - The raw text of the job posting
 * @returns {string} A formatted prompt for the LLM
 */
function createJobPostingPrompt(jobPostingText) {
    return `Please analyze this job posting and extract the following information in valid JSON format:
{
    "company": "company name",
    "title": "job title",
    "location": "job location",
    "description": "summarize the job description in one to two sentences",
    "salary": "salary information if available, just a number or range. Ensure that the value is represented as a string for JSON."
}

Job Posting:
${jobPostingText}

Please provide only the JSON response, no additional text.`;
}

/**
 * Fetches the content of a job posting from a URL
 * @param {string} url - The URL of the job posting
 * @returns {Promise<string>} The text content of the job posting
 */
async function fetchJobPosting(url) {
    try {
        const response = await fetch('http://localhost:3000/fetch-job', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch job posting: ${response.status}`);
        }

        const data = await response.json();
        const text = data.content;
        
        // Create a temporary DOM element to parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        // Remove script and style elements
        const scripts = doc.getElementsByTagName('script');
        const styles = doc.getElementsByTagName('style');
        Array.from(scripts).forEach(script => script.remove());
        Array.from(styles).forEach(style => style.remove());
        // Get the text content
        return doc.body.textContent.trim();
    } catch (error) {
        throw new Error(`Error fetching job posting: ${error.message}`);
    }
}

/**
 * Calls the Groq API with the given prompt
 * @param {string} prompt - The prompt to send to the API
 * @param {string} apiKey - The Groq API key
 * @returns {Promise<Object>} The parsed JSON response
 */
async function callGroqAPI(prompt, apiKey) {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Error calling Groq API: ${error.message}`);
    }
}

/**
 * Displays the results in the table
 * @param {Object} data - The parsed job data
 */
function displayResults(data) {
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = ''; // Clear existing rows
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${data.company || 'N/A'}</td>
        <td>${data.title || 'N/A'}</td>
        <td>${data.location || 'N/A'}</td>
        <td>${data.description || 'N/A'}</td>
        <td>${data.salary || 'N/A'}</td>
    `;
    tbody.appendChild(row);
}

// Example usage:
// const jobPostingHTML = document.querySelector('.job-posting').innerHTML;
// const jobData = parseJobPosting(jobPostingHTML);
// console.log(jobData);

// const jobPostingText = "Paste job posting text here...";
// const prompt = createJobPostingPrompt(jobPostingText);
// console.log(prompt); 